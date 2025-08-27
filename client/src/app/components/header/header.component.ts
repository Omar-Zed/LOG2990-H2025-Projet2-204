import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-header',
    standalone: true,
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    @Input() title: string;
    @Input() stepNumber: string;
    @Input() onClick: () => void;
}
