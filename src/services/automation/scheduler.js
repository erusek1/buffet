/**
 * Service for scheduling automated analysis tasks
 */
import localStorageService from '../storage/localStorageService';

const SCHEDULER_CONFIG_KEY = 'scheduler_config';
const LAST_RUN_KEY = 'scheduler_last_run';

// Default scheduler configuration
const DEFAULT_CONFIG = {
  enabled: false,
  interval: 'daily', // 'hourly', 'daily', 'weekly', 'monthly'
  runTime: '08:00', // For daily, weekly, monthly
  dayOfWeek: 1, // 0-6, Sunday is 0 (for weekly)
  dayOfMonth: 1, // 1-31 (for monthly)
  watchlistOnly: true, // Only analyze watchlist stocks
  notifyOnComplete: true
};

/**
 * Gets the scheduler configuration
 * @returns {Object} - Scheduler configuration
 */
const getSchedulerConfig = () => {
  return localStorageService.getItem(SCHEDULER_CONFIG_KEY, DEFAULT_CONFIG);
};

/**
 * Updates the scheduler configuration
 * @param {Object} config - New configuration to apply
 * @returns {boolean} - Whether the operation was successful
 */
const updateSchedulerConfig = (config) => {
  try {
    const currentConfig = getSchedulerConfig();
    const newConfig = { ...currentConfig, ...config };
    
    return localStorageService.setItem(SCHEDULER_CONFIG_KEY, newConfig);
  } catch (error) {
    console.error('Error updating scheduler configuration:', error);
    return false;
  }
};

/**
 * Enables the scheduler
 * @returns {boolean} - Whether the operation was successful
 */
const enableScheduler = () => {
  return updateSchedulerConfig({ enabled: true });
};

/**
 * Disables the scheduler
 * @returns {boolean} - Whether the operation was successful
 */
const disableScheduler = () => {
  return updateSchedulerConfig({ enabled: false });
};

/**
 * Records the last run time of the scheduler
 * @returns {boolean} - Whether the operation was successful
 */
const recordSchedulerRun = () => {
  try {
    return localStorageService.setItem(LAST_RUN_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error recording scheduler run:', error);
    return false;
  }
};

/**
 * Gets the last run time of the scheduler
 * @returns {string|null} - ISO timestamp of last run or null if never run
 */
const getLastRunTime = () => {
  return localStorageService.getItem(LAST_RUN_KEY, null);
};

/**
 * Checks if the scheduler should run now based on configuration
 * @returns {boolean} - Whether the scheduler should run
 */
const shouldRunNow = () => {
  const config = getSchedulerConfig();
  
  if (!config.enabled) {
    return false;
  }
  
  const lastRunTime = getLastRunTime();
  
  // If never run, should run now
  if (!lastRunTime) {
    return true;
  }
  
  const now = new Date();
  const lastRun = new Date(lastRunTime);
  
  // Check based on interval
  switch (config.interval) {
    case 'hourly':
      // Check if at least 1 hour has passed
      return now.getTime() - lastRun.getTime() >= 60 * 60 * 1000;
      
    case 'daily': {
      // Split run time into hours and minutes
      const [hours, minutes] = config.runTime.split(':').map(Number);
      
      // Check if it's the correct time of day and hasn't run today
      const runTimeToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes
      );
      
      return now >= runTimeToday && 
        (lastRun.getDate() !== now.getDate() || 
        lastRun.getMonth() !== now.getMonth() || 
        lastRun.getFullYear() !== now.getFullYear());
    }
      
    case 'weekly': {
      // Check if it's the correct day of week and time, and hasn't run this week
      const [hours, minutes] = config.runTime.split(':').map(Number);
      
      // Current day of week (0-6)
      const currentDayOfWeek = now.getDay();
      
      // Time on the target day
      const runTimeThisWeek = new Date(now);
      runTimeThisWeek.setHours(hours, minutes, 0, 0);
      
      // Adjust to target day of week
      const dayDiff = config.dayOfWeek - currentDayOfWeek;
      runTimeThisWeek.setDate(runTimeThisWeek.getDate() + dayDiff);
      
      // If the target day is earlier in the week, move to next week
      if (dayDiff < 0) {
        runTimeThisWeek.setDate(runTimeThisWeek.getDate() + 7);
      }
      
      // If it's the target day and time has passed, and we haven't run in the last 6 days
      if (currentDayOfWeek === config.dayOfWeek && now >= runTimeThisWeek) {
        const sixDaysAgo = new Date(now);
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        return lastRun < sixDaysAgo;
      }
      
      return false;
    }
    
    case 'monthly': {
      // Check if it's the correct day of month and time, and hasn't run this month
      const [hours, minutes] = config.runTime.split(':').map(Number);
      
      // Current day of month (1-31)
      const currentDayOfMonth = now.getDate();
      
      // If the target day doesn't exist in this month (e.g., 31st in Feb),
      // use the last day of the month
      const targetDay = Math.min(
        config.dayOfMonth,
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      );
      
      // If it's the target day and time has passed, and we haven't run this month
      if (currentDayOfMonth === targetDay) {
        const runTimeToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          currentDayOfMonth,
          hours,
          minutes
        );
        
        return now >= runTimeToday && 
          (lastRun.getMonth() !== now.getMonth() || 
          lastRun.getFullYear() !== now.getFullYear());
      }
      
      return false;
    }
    
    default:
      return false;
  }
};

const schedulerService = {
  getSchedulerConfig,
  updateSchedulerConfig,
  enableScheduler,
  disableScheduler,
  recordSchedulerRun,
  getLastRunTime,
  shouldRunNow
};

export default schedulerService;