import { Component, Directive, HostBinding } from '@angular/core';

// The original <Table> wraps <table> in a scroll container; a directive can't add a
// wrapper element, so that one part is a tiny component instead of a directive.
@Component({
  selector: 'app-table',
  standalone: true,
  template: `
    <div class="relative w-full overflow-auto">
      <table class="w-full caption-bottom text-sm">
        <ng-content />
      </table>
    </div>
  `,
})
export class TableComponent {}

@Directive({ selector: 'thead[appTableHeader]', standalone: true })
export class TableHeaderDirective {
  @HostBinding('class') readonly hostClass = '[&_tr]:border-b';
}

@Directive({ selector: 'tbody[appTableBody]', standalone: true })
export class TableBodyDirective {
  @HostBinding('class') readonly hostClass = '[&_tr:last-child]:border-0';
}

@Directive({ selector: 'tfoot[appTableFooter]', standalone: true })
export class TableFooterDirective {
  @HostBinding('class') readonly hostClass = 'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0';
}

@Directive({ selector: 'tr[appTableRow]', standalone: true })
export class TableRowDirective {
  @HostBinding('class') readonly hostClass = 'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted';
}

@Directive({ selector: 'th[appTableHead]', standalone: true })
export class TableHeadDirective {
  @HostBinding('class') readonly hostClass =
    'h-12 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 md:px-4';
}

@Directive({ selector: 'td[appTableCell]', standalone: true })
export class TableCellDirective {
  @HostBinding('class') readonly hostClass = 'p-2 align-middle [&:has([role=checkbox])]:pr-0 md:p-4';
}

@Directive({ selector: 'caption[appTableCaption]', standalone: true })
export class TableCaptionDirective {
  @HostBinding('class') readonly hostClass = 'mt-4 text-sm text-muted-foreground';
}
