import { Injectable } from '@angular/core';
import { Product, Tournament, EventItem } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  getProducts(): Product[] {
    return [
      {
        id: 1,
        category: 'Gaming Gear',
        productName: 'Pro Gaming Headset with Noise Cancellation',
        seller: 'TechStore',
        price: '$149.99',
        rate: '4.8',
        reviews: '234 reviews',
        imageUrl:
          'https://images.unsplash.com/photo-1599669454699-248893623440?w=300&h=200&fit=crop',
      },
      {
        id: 2,
        category: 'Gaming Gear',
        productName: 'Mechanical Keyboard RGB Backlit',
        seller: 'GameHub',
        price: '$89.99',
        rate: '4.6',
        reviews: '156 reviews',
        imageUrl:
          'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=200&fit=crop',
      },
      {
        id: 3,
        category: 'Console',
        productName: 'PlayStation 5 Console',
        seller: 'ElectroMart',
        price: '$499.99',
        rate: '4.9',
        reviews: '1,234 reviews',
      },
      {
        id: 4,
        category: 'PC Parts',
        productName: 'RTX 4080 Graphics Card',
        seller: 'PCMaster',
        price: '$1,199.99',
        rate: '4.7',
        reviews: '89 reviews',
      },
      {
        id: 5,
        category: 'Audio',
        productName: 'Studio Monitor Speakers',
        seller: 'AudioPro',
        price: '$299.99',
        rate: '4.5',
        reviews: '67 reviews',
      },
    ];
  }

  getTournaments(): Tournament[] {
    return [
      {
        id: 1,
        category: 'upcoming',
        game: 'Valorant Community Cup',
        organizer: 'GM Events',
        startDate: '2025-10-12',
        prizePool: '$1,000',
        playersJoined: 64,
      },
      {
        id: 2,
        category: 'ongoing',
        game: 'FIFA Weekend League',
        organizer: 'Majlis Sports',
        startDate: '2025-09-20',
        prizePool: '$500',
        playersJoined: 128,
      },
      {
        id: 3,
        category: 'past',
        game: 'CS:GO Championship',
        organizer: 'Pro League',
        startDate: '2025-08-15',
        prizePool: '$5,000',
        playersJoined: 256,
      },
    ];
  }

  getEvents(): EventItem[] {
    return [
      {
        id: 1,
        category: 'upcoming',
        name: 'Community Mixer Night',
        organizer: 'GM Events',
        scheduledOn: '2025-09-20',
        location: 'Riyadh Arena',
      },
      {
        id: 2,
        category: 'ongoing',
        name: 'Pro Players Meetup',
        organizer: 'Majlis Sports',
        scheduledOn: '2025-09-06',
        location: 'Online',
      },
      {
        id: 3,
        category: 'past',
        name: 'Gaming Expo 2025',
        organizer: 'TechWorld',
        scheduledOn: '2025-07-10',
        location: 'Dubai Convention Center',
      },
    ];
  }
}
