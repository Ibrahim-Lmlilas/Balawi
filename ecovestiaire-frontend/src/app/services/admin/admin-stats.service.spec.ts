import { TestBed } from '@angular/core/testing';

import { AdminStatsService } from './admin-stats.service';

describe('AdminStatsService', () => {
  let service: AdminStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminStatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
