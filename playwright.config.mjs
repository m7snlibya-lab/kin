import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir:'./browser-tests',
  testMatch:'**/{app,features,usability}.spec.mjs',
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:process.env.CI ? 1 : 0,
  workers:2,
  reporter:'list',
  use:{baseURL:process.env.KIN_BASE_URL || 'http://127.0.0.1:4173/kin/',
    locale:'en-US', timezoneId:'Asia/Riyadh', trace:'retain-on-failure', screenshot:'only-on-failure'},
  projects:[
    {name:'desktop', use:{...devices['Desktop Chrome']}},
    {name:'mobile', use:{...devices['Pixel 7']}},
    {name:'firefox', use:{...devices['Desktop Firefox']}},
    {name:'webkit', use:{...devices['Desktop Safari']}},
    ...(!process.env.KIN_BASE_URL?[{name:'development',testMatch:'**/development.spec.mjs',use:{...devices['Desktop Chrome'],baseURL:'http://127.0.0.1:5175/'}}]:[])
  ],
  webServer:process.env.KIN_BASE_URL ? undefined : [{name:'release',
    command:'npm start', url:'http://127.0.0.1:4173/kin/', reuseExistingServer:!process.env.CI
  },{name:'development',command:'npm run dev -- --port 5175 --strictPort',url:'http://127.0.0.1:5175/',reuseExistingServer:!process.env.CI}]
});
