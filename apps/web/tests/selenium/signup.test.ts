import { Builder, By, until, WebDriver } from 'selenium-webdriver';

describe('Signup Validation Flow', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await new Builder().forBrowser('chrome').build();
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('should show a password mismatch error if passwords do not match', async () => {
    // 1. Navigate to the signup page
    await driver.get('http://localhost:3000/signup');

    // 2. Wait for the form elements to be present
    const nameInput = await driver.wait(until.elementLocated(By.id('full-name')), 5000);
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 5000);
    const passwordInput = await driver.wait(until.elementLocated(By.id('password')), 5000);
    const confirmInput = await driver.wait(until.elementLocated(By.id('confirm-password')), 5000);
    const submitBtn = await driver.wait(until.elementLocated(By.css('button[type="submit"]')), 5000);

    // 3. Fill out the form with non-matching passwords
    await nameInput.sendKeys('Test User');
    await emailInput.sendKeys('test-signup@example.com');
    await passwordInput.sendKeys('SecurePassword123');
    await confirmInput.sendKeys('DifferentPassword123'); // Mismatch!

    // 4. Submit the form
    await submitBtn.click();

    // 5. Wait for the "Password mismatch" toast
    // Sonner renders toasts as <li> elements. Using //li prevents us from accidentally selecting
    // the entire <body> tag which also technically contains the text.
    const toastError = await driver.wait(
      until.elementLocated(By.xpath("//li[contains(., 'Password mismatch')]")),
      10000
    );

    // 6. Assert that the toast text contains the expected validation message
    // Use getAttribute('textContent') instead of getText() because Sonner animates
    // the toast in, and getText() returns an empty string during CSS animations.
    const errorText = await toastError.getAttribute('textContent');
    expect(errorText).toContain('Password mismatch');
  });
});
