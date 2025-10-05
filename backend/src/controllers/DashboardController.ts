import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getStats(req: Request, res: Response) {
    try {
      const { start, end } = req.query as { start?: string; end?: string };
      const stats = await this.dashboardService.getStats(start, end);
      res.json(stats);
    } catch (error) {
      console.error('Error in DashboardController.getStats:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  testAuth(req: Request, res: Response) {
    try {
      res.json({ 
        message: 'Authentication is working', 
        user: req.user,
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      console.error('Error in DashboardController.testAuth:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 