import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'tests/browser',fullyParallel:false,workers:1,
 use:{baseURL:'http://127.0.0.1:5174',channel:'chrome',headless:true, screenshot:'only-on-failure'},
 webServer:{command:'npm.cmd run dev -- --port 5174 --strictPort',url:'http://127.0.0.1:5174',reuseExistingServer:process.env.PLAYWRIGHT_REUSE_SERVER==='1',env:{VITE_SUPABASE_URL:'https://piano-test.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'test-publishable-key'}},
})
