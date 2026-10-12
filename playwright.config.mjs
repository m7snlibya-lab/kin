import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir:'./browser-tests',
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:process.env.CI ? 1 : 0,
  workers:2,
  reporter:'list',
  use:{baseURL:process.env.KIN_BASE_URL || 'http://127.0.0.1:4173/kin/',
    locale:'en-US', timezoneId:'Asia/Riyadh', trace:'retain-on-failure', screenshot:'only-on-failure'},
  projects:[
    {name:'desktop', use:{...devices['Desktop Chrome']}},
    {name:'mobile', use:{...devices['Pixel 7']}}
  ],
  webServer:process.env.KIN_BASE_URL ? undefined : {
    command:'npm start', url:'http://127.0.0.1:4173/kin/', reuseExistingServer:!process.env.CI
  }
});
