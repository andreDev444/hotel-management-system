
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <span className="home-brand-icon">GH</span>
          <span>GRAND HOTEL BOUTIQUE</span>
        </div>

        <button
          className="home-access-button"
          onClick={() => navigate('/login')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Acceso empleados
        </button>
        
      </header>

      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">
            UNA EXPERIENCIA EXCEPCIONAL
          </span>

          <h1>
            Descubre el placer
            <br />
            de sentirte <span>como en casa.</span>
          </h1>

          <p>
            Un espacio donde la elegancia, el confort y la
            hospitalidad se encuentran para ofrecerte una
            experiencia inolvidable.
          </p>

          <button
            className="home-booking-button"
            onClick={() => navigate('/reservar')}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
            Reservar una habitación
            <span className="booking-arrow">›</span>
          </button>

        </div>

        <div className="home-hero-decoration">
          <div className="home-decoration-circle">
            <span>GH</span>
          </div>
          <span className="home-decoration-caption">
            ELEGANCIA · CONFORT · HOSPITALIDAD
          </span>
        </div>
      </section>
      
      
      <section className="home-services">
        <article className="home-service">
          <span className="service-icon">✧</span>
          <h2>Habitaciones exclusivas</h2>
          <p>
            Espacios diseñados para ofrecerte descanso,
            comodidad y tranquilidad.
          </p>
        </article>

        <article className="home-service">
          <span className="service-icon">♕</span>
          <h2>Experiencia boutique</h2>
          <p>
            Disfruta de una atención especial en un ambiente
            de elegancia y hospitalidad.
          </p>
        </article>

        <article className="home-service">
          <span className="service-icon">⌑</span>
          <h2>Reserva fácilmente</h2>
          <p>
            Encuentra tu espacio ideal y realiza tu reserva
            de manera sencilla.
          </p>
        </article>
      </section>

      <footer className="home-footer">
        <span>GRAND HOTEL BOUTIQUE</span>
        <span>Un lugar para disfrutar cada momento.</span>
      </footer>
    </main>
  );
}
