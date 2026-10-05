import { Builder, By, until, WebDriver } from 'selenium-webdriver';

describe('Selenium Example Test', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    // Initializes the Chrome driver. Make sure you have Chrome installed.
    // If you prefer another browser, change 'chrome' to 'firefox', 'edge', etc.
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should load the local app', async () => {
    // Navigates to your local development server
    // Make sure to run `npm run dev` before running tests!
    await driver.get('http://localhost:3000');
    
    // Gets the title of the page
    const title = await driver.getTitle();
    
    // Basic assertion to ensure it loaded something
    expect(title).toBeDefined();
    
    // Example of how to wait for an element and interact with it:
    // await driver.wait(until.elementLocated(By.css('h1')), 5000);
    // const headerText = await driver.findElement(By.css('h1')).getText();
    // expect(headerText).toContain('Expected Header');
  });
});
