// app.module.ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component'; // <-- Import MainComponent

@NgModule({
  declarations: [AppComponent, MainComponent], // <-- Add MainComponent to declarations
  imports: [BrowserModule, AppRoutingModule, FormsModule], // <-- Include FormsModule
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

