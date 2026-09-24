import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { produce } from 'immer';
import type { DisplayPairing, ManualPairing, Match, Player, Round, StandingsPlayer, Tournament } from '../models/types';
import { getPeruTimestamp } from '../lib/peru-time';
import {
  TOURNAMENT_URL,
  buildCurrentPairings,
  calculateStandings,
  getRecommendedRounds,
  initialTournamentState,
  isFechaGuardadoNewer,
  isValidTournamentPayload,
  parseStoredTournament,
  swissPair,
} from '../lib/tournament-logic';

export type ResultInput = { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number };

@Injectable({ providedIn: 'root' })
export class TournamentService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tournament = signal<Tournament | null>(null);
  readonly viewingRound = signal<number | null>(null);
  readonly pendingImport = signal<string | null>(null);
  readonly isUpdatingToLatest = signal(false);

  // fechaGuardado of the last version we know for certain we're in sync with (either just
  // fetched or just saved). Used to detect whether the remote copy has moved ahead of us.
  private lastSyncedFechaGuardado: string | null = null;
  // Set right before we update the tournament signal as a side-effect of a save (to reflect the
  // new fechaGuardado, or to adopt a newer remote version) so the autosave effect doesn't treat
  // that update as a fresh edit and re-save it.
  private skipNextAutosave = false;
  private isInitialLoad = true;
  private autosaveHandle: ReturnType<typeof setTimeout> | undefined;
  // Saves run one at a time: overlapping saves would see each other's write as a "newer remote
  // version" and adopt it, reverting whatever the later save was trying to store.
  private saveQueue: Promise<unknown> = Promise.resolve();

  readonly standings = computed<StandingsPlayer[]>(() => {
    const tournament = this.tournament();
    const viewingRound = this.viewingRound();
    if (!tournament) return [];
    if (viewingRound !== null) {
      return calculateStandings({ ...tournament, rounds: tournament.rounds.slice(0, viewingRound) });
    }
    return calculateStandings(tournament);
  });

  readonly currentPairings = computed<DisplayPairing[]>(() => buildCurrentPairings(this.tournament(), this.viewingRound()));

  readonly allResultsSubmitted = computed(() => {
    const tournament = this.tournament();
    if (!tournament || tournament.status !== 'running' || tournament.rounds.length === 0) return false;
    const currentRound = tournament.rounds[tournament.rounds.length - 1];
    return !!currentRound && currentRound.status === 'finished';
  });

  readonly recommendedRounds = computed(() => getRecommendedRounds(this.tournament()?.players.length || 0));

  constructor() {
    if (this.isBrowser) {
      this.fetchTournament();
      this.listenForRemoteChanges();
    }

    // Debounced autosave: any edit that isn't the result of a fetch/save adopting remote state
    // gets written back 500ms after the last change, mirroring the original React effect.
    effect(() => {
      const tournament = this.tournament();
      const shouldSkip = this.skipNextAutosave;
      this.skipNextAutosave = false;

      if (this.isInitialLoad) {
        if (tournament) this.isInitialLoad = false;
        return;
      }
      if (!tournament || shouldSkip || !this.isBrowser) return;

      clearTimeout(this.autosaveHandle);
      this.autosaveHandle = setTimeout(() => {
        this.persistTournament(tournament);
      }, 500);
    });
  }

  private async fetchTournament(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const response = await fetch(TOURNAMENT_URL, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      const data = response.ok ? parseStoredTournament(await response.json()) : null;
      if (isValidTournamentPayload(data)) {
        this.lastSyncedFechaGuardado = data.fechaGuardado ?? null;
        this.skipNextAutosave = true;
        this.tournament.set(data);
      } else {
        this.lastSyncedFechaGuardado = null;
        this.skipNextAutosave = true;
        this.tournament.set(initialTournamentState);
      }
    } catch {
      // Network error: keep what we already have instead of showing an empty registration.
      if (this.tournament()) return;
      this.lastSyncedFechaGuardado = null;
      this.skipNextAutosave = true;
      this.tournament.set(initialTournamentState);
    }
  }

  // Firebase REST streaming (native EventSource, auto-reconnects): every device adopts saves
  // made elsewhere as they happen, so viewers don't stay stuck on an old round or on registration.
  private listenForRemoteChanges(): void {
    new EventSource(TOURNAMENT_URL).addEventListener('put', (event) => {
      const { path, data } = JSON.parse((event as MessageEvent).data);
      if (path !== '/') return;
      const remote = parseStoredTournament(data);
      if (!isValidTournamentPayload(remote) || !isFechaGuardadoNewer(remote.fechaGuardado, this.lastSyncedFechaGuardado)) return;
      this.lastSyncedFechaGuardado = remote.fechaGuardado ?? null;
      this.skipNextAutosave = true;
      this.tournament.set(remote);
    });
  }

  // Central write path: every save (autosave, "Guardar Estado", next round, etc.) goes through
  // here so the newer-version check always runs. Before writing, it re-fetches the remote copy
  // and compares its fechaGuardado against the last version we know we're based on. If the
  // remote has moved ahead (someone else saved from another device/tab while we were editing),
  // we don't overwrite it - we adopt it locally instead and surface the "Actualizando" state.
  // Otherwise we stamp the save with an authoritative Peru timestamp and write it.
  private persistTournament(tournamentToSave: Tournament): Promise<boolean> {
    const save = this.saveQueue.then(() => this.saveNow(tournamentToSave));
    this.saveQueue = save;
    return save;
  }

  private async saveNow(tournamentToSave: Tournament): Promise<boolean> {
    try {
      const checkResponse = await fetch(TOURNAMENT_URL, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (checkResponse.ok) {
        const remoteData = parseStoredTournament(await checkResponse.json());
        if (isValidTournamentPayload(remoteData) && isFechaGuardadoNewer(remoteData.fechaGuardado, this.lastSyncedFechaGuardado)) {
          this.isUpdatingToLatest.set(true);
          this.lastSyncedFechaGuardado = remoteData.fechaGuardado ?? null;
          this.skipNextAutosave = true;
          this.tournament.set(remoteData);
          this.viewingRound.set(null);
          setTimeout(() => this.isUpdatingToLatest.set(false), 1500);
          return false;
        }
      }

      const fechaGuardado = await getPeruTimestamp();
      const finalTournament: Tournament = { ...tournamentToSave, fechaGuardado };
      // Mark as synced before writing so our own save echoing back over the stream isn't
      // mistaken for someone else's newer version.
      const previousSynced = this.lastSyncedFechaGuardado;
      this.lastSyncedFechaGuardado = fechaGuardado;

      const saveResponse = await fetch(TOURNAMENT_URL, {
        method: 'PUT',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(JSON.stringify(finalTournament)),
      });

      if (saveResponse.ok) {
        // Only stamp the new fechaGuardado locally if nothing was edited while saving; otherwise
        // keep the newer local edit (its own autosave is already queued).
        if (this.tournament() === tournamentToSave) {
          this.skipNextAutosave = true;
          this.tournament.set(finalTournament);
        }
        return true;
      }
      this.lastSyncedFechaGuardado = previousSynced;
      return false;
    } catch (error) {
      console.error('Error al guardar el torneo:', error);
      return false;
    }
  }

  async forceSaveTournament(): Promise<boolean> {
    const tournament = this.tournament();
    if (!tournament) return false;
    return this.persistTournament(tournament);
  }

  async refreshTournament(): Promise<void> {
    await this.fetchTournament();
  }

  addPlayer(name: string): void {
    const tournament = this.tournament();
    if (tournament?.status !== 'registration') return;
    const newPlayer: Player = { id: `player-${Date.now()}-${Math.random()}`, name };
    this.tournament.set(
      produce(tournament, (draft) => {
        draft.players.push(newPlayer);
        draft.players.sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  removePlayer(id: string): void {
    const tournament = this.tournament();
    if (tournament?.status !== 'registration') return;
    this.tournament.set(
      produce(tournament, (draft) => {
        draft.players = draft.players.filter((p) => p.id !== id);
      })
    );
  }

  startTournament(): void {
    const tournament = this.tournament();
    if (tournament?.status !== 'registration' || tournament.players.length < 2) return;
    const firstRoundMatches = swissPair(tournament.players, []);
    this.tournament.set(
      produce(tournament, (draft) => {
        draft.status = 'running';
        draft.rounds = [{ matches: firstRoundMatches, status: 'started' }];
      })
    );
  }

  startManualTournament(manualPairings: ManualPairing[]): void {
    const tournament = this.tournament();
    if (tournament?.status !== 'registration' || tournament.players.length < 2) return;
    const firstRoundMatches: Match[] = manualPairings.map((p) => ({
      playerId1: p.player1.id,
      playerId2: p.player2.id === 'bye' ? null : p.player2.id,
      wonGamesPlayer1: p.player2.id === 'bye' ? 2 : 0,
      wonGamesPlayer2: 0,
      isSubmitted: p.player2.id === 'bye',
    }));
    this.tournament.set(
      produce(tournament, (draft) => {
        draft.status = 'running';
        draft.rounds = [{ matches: firstRoundMatches, status: 'started' }];
      })
    );
  }

  generateNextRound(): void {
    const tournament = this.tournament();
    if (!tournament || tournament.status !== 'running') return;
    if (tournament.rounds.length >= getRecommendedRounds(tournament.players.length)) return;

    const newTournament = produce(tournament, (draft) => {
      const newRoundMatches = swissPair(draft.players, draft.rounds as Round[]);
      draft.rounds.push({ matches: newRoundMatches, status: 'started' });
    });

    this.tournament.set(newTournament);
    this.viewingRound.set(null);

    // Save immediately (rather than waiting for the debounced autosave) so the next round is
    // visible to other devices right away; goes through the same conflict-checked path.
    this.persistTournament(newTournament).catch((error) => {
      console.error('Error automatically saving tournament on next round:', error);
    });
  }

  submitResults(roundIndex: number, results: ResultInput[]): void {
    const tournament = this.tournament();
    if (!tournament) return;

    this.tournament.set(
      produce(tournament, (draft) => {
        if (roundIndex < draft.rounds.length - 1) {
          draft.rounds.length = roundIndex + 1;
        }

        const roundToUpdate = draft.rounds[roundIndex];
        if (!roundToUpdate) return;

        results.forEach((result) => {
          const match = roundToUpdate.matches.find(
            (m) => m.playerId1 === result.p1Id && (m.playerId2 === result.p2Id || m.playerId2 === null)
          );
          if (match) {
            match.wonGamesPlayer1 = result.p1Games;
            match.wonGamesPlayer2 = result.p2Games;
            match.isSubmitted = true;
          }
        });

        if (roundToUpdate.matches.every((m) => m.isSubmitted)) {
          roundToUpdate.status = 'finished';
        }
      })
    );

    if (this.viewingRound() !== null) {
      this.viewingRound.set(null);
    }
  }

  updatePairings(newPairings: ManualPairing[]): void {
    const tournament = this.tournament();
    if (!tournament || tournament.status !== 'running') return;
    const viewingRound = this.viewingRound();
    const currentRoundIndex = viewingRound ? viewingRound - 1 : tournament.rounds.length - 1;

    const newRoundMatches: Match[] = newPairings.map((p) => ({
      playerId1: p.player1.id,
      playerId2: p.player2.id === 'bye' ? null : p.player2.id,
      wonGamesPlayer1: p.player2.id === 'bye' ? 2 : 0,
      wonGamesPlayer2: 0,
      isSubmitted: p.player2.id === 'bye',
    }));

    this.tournament.set(
      produce(tournament, (draft) => {
        if (currentRoundIndex < draft.rounds.length - 1) {
          draft.rounds.length = currentRoundIndex + 1;
        }
        draft.rounds[currentRoundIndex] = { matches: newRoundMatches, status: 'started' };
      })
    );

    if (this.viewingRound() !== null) {
      this.viewingRound.set(null);
    }
  }

  goToRound(round: number | null): void {
    this.viewingRound.set(round);
  }

  resetTournament(): void {
    this.tournament.update((tournament) =>
      tournament
        ? produce(tournament, (draft) => {
            draft.rounds = [];
            draft.status = 'registration';
          })
        : tournament
    );
    this.viewingRound.set(null);
  }

  exportTournament(): string {
    const tournament = this.tournament();
    return JSON.stringify(tournament ?? initialTournamentState, null, 2);
  }

  importTournament(fileContent: string): void {
    this.pendingImport.set(fileContent);
  }

  confirmImport(): void {
    const pendingImport = this.pendingImport();
    if (!pendingImport) return;
    try {
      const loadedTournament = JSON.parse(pendingImport);
      if (loadedTournament.players && loadedTournament.status && loadedTournament.rounds) {
        this.tournament.set(loadedTournament);
        this.viewingRound.set(null);
      } else {
        throw new Error('Invalid tournament file structure.');
      }
    } catch (e) {
      console.error('Failed to parse imported file:', e);
    } finally {
      this.pendingImport.set(null);
    }
  }

  cancelImport(): void {
    this.pendingImport.set(null);
  }

  rollbackToRound(roundIndex: number): void {
    this.tournament.update((tournament) =>
      tournament
        ? produce(tournament, (draft) => {
            if (roundIndex < 0 || roundIndex >= draft.rounds.length) return;
            draft.rounds.length = roundIndex + 1;
            const roundToEdit = draft.rounds[roundIndex];
            if (!roundToEdit) return;
            roundToEdit.status = 'started';
            roundToEdit.matches.forEach((match) => {
              if (match.playerId2 !== null) {
                match.wonGamesPlayer1 = 0;
                match.wonGamesPlayer2 = 0;
              }
              match.isSubmitted = match.playerId2 === null;
            });
          })
        : tournament
    );
    this.viewingRound.set(null);
  }
}
