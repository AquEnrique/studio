import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../ui/button/button.directive';
import { LucideIcons } from '../../core/icons';
import { LifePointsService, PlayerKey } from '../../core/services/life-points.service';
import { ConfirmDialogService } from '../../ui/dialog/confirm-dialog.service';
import { PlayerPanelComponent } from './player-panel/player-panel.component';

const STEP_OPTIONS = [100, 500, 1000] as const;

@Component({
  selector: 'app-life-points',
  standalone: true,
  imports: [RouterLink, ButtonDirective, LucideIcons, PlayerPanelComponent],
  templateUrl: './life-points.component.html',
})
export class LifePointsComponent {
  protected readonly lifePoints = inject(LifePointsService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly stepOptions = STEP_OPTIONS;
  protected readonly step = signal<number>(100);

  setStep(value: number): void {
    this.step.set(value);
  }

  adjust(player: PlayerKey, delta: number): void {
    this.lifePoints.adjust(player, delta);
  }

  async confirmReset(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '¿Reiniciar puntos de vida?',
      description: 'Esto pondrá los puntos de vida de ambos jugadores de nuevo en 8000. Esta acción no se puede deshacer.',
      confirmLabel: 'Reiniciar',
      variant: 'destructive',
    });
    if (confirmed) this.lifePoints.resetAll();
  }
}
