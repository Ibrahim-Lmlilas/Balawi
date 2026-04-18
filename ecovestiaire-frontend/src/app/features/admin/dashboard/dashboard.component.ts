import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStatsService } from '../../../services/admin/admin-stats.service';
import { AdminStats } from '../../../models/admin.model';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private statsService = inject(AdminStatsService);

  stats = signal<AdminStats | null>(null);
  isLoading = signal(true);

  constructor() {
    Chart.register(...registerables);
  }

  // Chart Configurations
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } }
    }
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  ngOnInit() {
    this.statsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur stats admin', err);
        this.isLoading.set(false);
      }
    });
  }

  // Helper methods for chart data
  getCategoriesData(): ChartData<'pie'> {
    const s = this.stats();
    const entries = Object.entries(s?.itemsPerCategory || {});
    return {
      labels: entries.map(([label]) => label),
      datasets: [{
        data: entries.map(([, value]) => value),
        backgroundColor: ['#0B0B0B', '#A3FF12', '#7CFF00', '#BDBDBD', '#1A1A1A']
      }]
    };
  }

  getUsersData(): ChartData<'line'> {
    const s = this.stats();
    const entries = Object.entries(s?.newUsersPerDay || {});
    // Si pas de données, on met des labels par défaut
    const labels = entries.length ? entries.map(([date]) => date) : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const data = entries.length ? entries.map(([, count]) => count) : [0, 0, 0, 0, 0, 0, 0];

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          label: 'Nouveaux Inscrits',
          borderColor: '#A3FF12',
          backgroundColor: 'rgba(163, 255, 18, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#0B0B0B',
          pointBorderColor: '#A3FF12',
          pointBorderWidth: 2,
          pointRadius: 4
        }
      ]
    };
  }
}
