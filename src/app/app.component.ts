import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { FooterComponent } from "./core/components/footer/footer.component";
import { ChatbotComponent } from "./shared/components/chatbot/chatbot.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ChatbotComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'GamerMajlis';
}
