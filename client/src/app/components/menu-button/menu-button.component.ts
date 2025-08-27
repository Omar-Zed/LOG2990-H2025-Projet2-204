import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-menu-button',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './menu-button.component.html',
    styleUrls: ['./menu-button.component.scss'],
})
export class MenuButtonComponent {
    @Input() containerClass: string = 'container orange-container';
    @Input() spriteImage: string = './assets/images/menu/pokemon/normal/charizard.png';
    @Input() textContent: string = '';
    @Input() routePath!: string;

    isActive: boolean = false;
    private router: Router = inject(Router);

    navigateWithDelay() {
        this.isActive = true;
        const delay = 200;
        setTimeout(() => {
            this.isActive = false;
            this.router.navigate([this.routePath]);
        }, delay);
    }
}
