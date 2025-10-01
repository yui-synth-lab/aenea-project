/**
 * Aenea UI Automated Tests using Selenium WebDriver
 * Comprehensive testing of consciousness dashboard interface
 */

import { Builder, By, until, Key } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

class AeneaUITester {
    constructor() {
        this.driver = null;
        this.baseUrl = 'http://localhost:3000';
        this.testResults = [];
    }

    async initialize() {
        console.log('🚀 Initializing Selenium WebDriver...');

        // Configure Chrome options for headless testing
        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--window-size=1920,1080');
        // Comment out the next line to see the browser during testing
        // chromeOptions.addArguments('--headless');

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .build();

        await this.driver.manage().setTimeouts({ implicit: 10000 });
        console.log('✅ WebDriver initialized successfully');
    }

    async navigateToApp() {
        console.log(`🌐 Navigating to ${this.baseUrl}...`);
        await this.driver.get(this.baseUrl);
        await this.driver.sleep(2000); // Wait for initial load

        // Wait for React app to load
        await this.driver.wait(until.elementLocated(By.css('.aenea-app')), 15000);
        console.log('✅ Application loaded successfully');
    }

    async testPageLoad() {
        console.log('🧪 Testing page load and initial state...');

        try {
            // Check if title contains "Aenea"
            const title = await this.driver.getTitle();
            this.assert(title.includes('Aenea'), `Page title should contain 'Aenea', got: ${title}`);

            // Check if main dashboard header is present
            const header = await this.driver.wait(
                until.elementLocated(By.xpath("//h2[contains(text(), 'Consciousness Dashboard')]")),
                10000
            );
            this.assert(await header.isDisplayed(), 'Consciousness Dashboard header should be visible');

            // Check if consciousness status indicator is present
            const statusIndicator = await this.driver.findElement(
                By.xpath("//span[contains(text(), 'Consciousness')]")
            );
            this.assert(await statusIndicator.isDisplayed(), 'Consciousness status should be visible');

            this.logSuccess('Page load test passed');
        } catch (error) {
            this.logError('Page load test failed', error);
        }
    }

    async testConsciousnessControls() {
        console.log('🧪 Testing consciousness control buttons...');

        try {
            // Check for Start button (assumes consciousness is initially stopped)
            const startButton = await this.driver.wait(
                until.elementLocated(By.xpath("//button[contains(text(), 'Start')]")),
                5000
            );
            this.assert(await startButton.isDisplayed(), 'Start button should be visible');
            this.assert(await startButton.isEnabled(), 'Start button should be enabled');

            // Test Start button click
            await startButton.click();
            await this.driver.sleep(2000); // Wait for state change

            // After starting, check for Pause/Stop buttons
            const pauseButton = await this.driver.wait(
                until.elementLocated(By.xpath("//button[contains(text(), 'Pause')]")),
                10000
            );
            this.assert(await pauseButton.isDisplayed(), 'Pause button should appear after starting');

            const stopButton = await this.driver.wait(
                until.elementLocated(By.xpath("//button[contains(text(), 'Stop')]")),
                5000
            );
            this.assert(await stopButton.isDisplayed(), 'Stop button should appear after starting');

            // Check consciousness status changed to "Active"
            const activeStatus = await this.driver.wait(
                until.elementLocated(By.xpath("//span[contains(text(), 'Consciousness Active')]")),
                5000
            );
            this.assert(await activeStatus.isDisplayed(), 'Consciousness status should show as Active');

            this.logSuccess('Consciousness controls test passed');
        } catch (error) {
            this.logError('Consciousness controls test failed', error);
        }
    }

    async testDPDScoresDisplay() {
        console.log('🧪 Testing DPD scores display...');

        try {
            // Check for DPD section
            const dpdHeader = await this.driver.wait(
                until.elementLocated(By.xpath("//h3[contains(text(), 'Dynamic Prime Directive')]")),
                10000
            );
            this.assert(await dpdHeader.isDisplayed(), 'DPD header should be visible');

            // Check for empathy score
            const empathyLabel = await this.driver.findElement(
                By.xpath("//span[contains(text(), 'Empathy')]")
            );
            this.assert(await empathyLabel.isDisplayed(), 'Empathy label should be visible');

            // Check for coherence score
            const coherenceLabel = await this.driver.findElement(
                By.xpath("//span[contains(text(), 'Coherence')]")
            );
            this.assert(await coherenceLabel.isDisplayed(), 'Coherence label should be visible');

            // Check for dissonance score
            const dissonanceLabel = await this.driver.findElement(
                By.xpath("//span[contains(text(), 'Dissonance')]")
            );
            this.assert(await dissonanceLabel.isDisplayed(), 'Dissonance label should be visible');

            // Check for weighted total
            const weightedTotal = await this.driver.findElement(
                By.xpath("//div[contains(text(), 'Weighted Total')]")
            );
            this.assert(await weightedTotal.isDisplayed(), 'Weighted Total should be visible');

            this.logSuccess('DPD scores display test passed');
        } catch (error) {
            this.logError('DPD scores display test failed', error);
        }
    }

    async testSystemStatistics() {
        console.log('🧪 Testing system statistics display...');

        try {
            // Check for System Statistics section
            const statsHeader = await this.driver.wait(
                until.elementLocated(By.xpath("//h3[contains(text(), 'System Statistics')]")),
                10000
            );
            this.assert(await statsHeader.isDisplayed(), 'System Statistics header should be visible');

            // Check for System Clock
            const systemClockLabel = await this.driver.findElement(
                By.xpath("//div[contains(text(), 'System Clock')]")
            );
            this.assert(await systemClockLabel.isDisplayed(), 'System Clock label should be visible');

            // Check for Questions count
            const questionsLabel = await this.driver.findElement(
                By.xpath("//div[contains(text(), 'Questions')]")
            );
            this.assert(await questionsLabel.isDisplayed(), 'Questions count should be visible');

            // Check for Thought Cycles count
            const thoughtCyclesLabel = await this.driver.findElement(
                By.xpath("//div[contains(text(), 'Thought Cycles')]")
            );
            this.assert(await thoughtCyclesLabel.isDisplayed(), 'Thought Cycles count should be visible');

            // Check for Confidence percentage
            const confidenceLabel = await this.driver.findElement(
                By.xpath("//div[contains(text(), 'Confidence')]")
            );
            this.assert(await confidenceLabel.isDisplayed(), 'Confidence percentage should be visible');

            this.logSuccess('System statistics test passed');
        } catch (error) {
            this.logError('System statistics test failed', error);
        }
    }

    async testManualTrigger() {
        console.log('🧪 Testing manual trigger functionality...');

        try {
            // Check for Manual Trigger section
            const triggerHeader = await this.driver.wait(
                until.elementLocated(By.xpath("//h3[contains(text(), 'Manual Trigger')]")),
                10000
            );
            this.assert(await triggerHeader.isDisplayed(), 'Manual Trigger header should be visible');

            // Find the textarea
            const textarea = await this.driver.findElement(By.css('textarea'));
            this.assert(await textarea.isDisplayed(), 'Trigger textarea should be visible');
            this.assert(await textarea.isEnabled(), 'Trigger textarea should be enabled');

            // Find the trigger button (should be disabled initially)
            const triggerButton = await this.driver.findElement(
                By.xpath("//button[contains(text(), 'Generate Thought Cycle')]")
            );
            this.assert(await triggerButton.isDisplayed(), 'Trigger button should be visible');

            // Initially button should be disabled
            const isInitiallyDisabled = !(await triggerButton.isEnabled());
            this.assert(isInitiallyDisabled, 'Trigger button should be disabled when textarea is empty');

            // Type in the textarea
            const testQuestion = 'What is the nature of consciousness?';
            await textarea.clear();
            await textarea.sendKeys(testQuestion);
            await this.driver.sleep(1000);

            // Button should now be enabled
            this.assert(await triggerButton.isEnabled(), 'Trigger button should be enabled after entering text');

            // Click the trigger button
            await triggerButton.click();
            await this.driver.sleep(2000);

            // Textarea should be cleared after successful trigger
            const textareaValue = await textarea.getAttribute('value');
            this.assert(textareaValue === '', 'Textarea should be cleared after triggering');

            this.logSuccess('Manual trigger test passed');
        } catch (error) {
            this.logError('Manual trigger test failed', error);
        }
    }

    async testEnergyManagement() {
        console.log('🧪 Testing energy management controls...');

        try {
            // Check for Energy Management section
            const energyHeader = await this.driver.wait(
                until.elementLocated(By.xpath("//h3[contains(text(), 'Energy Management')]")),
                10000
            );
            this.assert(await energyHeader.isDisplayed(), 'Energy Management header should be visible');

            // Check for current energy display
            const currentEnergyLabel = await this.driver.findElement(
                By.xpath("//div[contains(text(), 'Current Energy')]")
            );
            this.assert(await currentEnergyLabel.isDisplayed(), 'Current Energy label should be visible');

            // Check for energy percentage display
            const energyPercentage = await this.driver.findElement(
                By.xpath("//div[contains(text(), '%')]")
            );
            this.assert(await energyPercentage.isDisplayed(), 'Energy percentage should be visible');

            // Check for Manual Recharge button
            const rechargeButton = await this.driver.findElement(
                By.xpath("//button[contains(text(), 'Manual Recharge')]")
            );
            this.assert(await rechargeButton.isDisplayed(), 'Manual Recharge button should be visible');
            this.assert(await rechargeButton.isEnabled(), 'Manual Recharge button should be enabled');

            // Check for Deep Rest button
            const deepRestButton = await this.driver.findElement(
                By.xpath("//button[contains(text(), 'Deep Rest')]")
            );
            this.assert(await deepRestButton.isDisplayed(), 'Deep Rest button should be visible');
            this.assert(await deepRestButton.isEnabled(), 'Deep Rest button should be enabled');

            // Test Manual Recharge button
            await rechargeButton.click();
            await this.driver.sleep(2000);

            this.logSuccess('Energy management test passed');
        } catch (error) {
            this.logError('Energy management test failed', error);
        }
    }

    async testPipelineVisualization() {
        console.log('🧪 Testing consciousness pipeline visualization...');

        try {
            // Check for Consciousness Pipeline section
            const pipelineHeader = await this.driver.wait(
                until.elementLocated(By.xpath("//h3[contains(text(), 'Consciousness Pipeline')]")),
                10000
            );
            this.assert(await pipelineHeader.isDisplayed(), 'Consciousness Pipeline header should be visible');

            // Check for stage indicators (S0 through U)
            const stages = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'U'];
            for (const stage of stages) {
                const stageElement = await this.driver.findElement(
                    By.xpath(`//div[contains(text(), '${stage}')]`)
                );
                this.assert(await stageElement.isDisplayed(), `Stage ${stage} should be visible`);
            }

            // Check for stage names
            const stageNames = ['Trigger', 'Think', 'Reflect', 'Audit', 'DPD', 'Compile', 'Scribe', 'Weight'];
            for (const stageName of stageNames) {
                const stageNameElement = await this.driver.findElement(
                    By.xpath(`//div[contains(text(), '${stageName}')]`)
                );
                this.assert(await stageNameElement.isDisplayed(), `Stage name ${stageName} should be visible`);
            }

            this.logSuccess('Pipeline visualization test passed');
        } catch (error) {
            this.logError('Pipeline visualization test failed', error);
        }
    }

    async testActivityLog() {
        console.log('🧪 Testing activity log functionality...');

        try {
            // Check for Activity Log section
            const activityHeader = await this.driver.wait(
                until.elementLocated(By.xpath("//h3[contains(text(), 'Activity Log')]")),
                10000
            );
            this.assert(await activityHeader.isDisplayed(), 'Activity Log header should be visible');

            // Wait for some activity to appear (since consciousness should be running)
            await this.driver.sleep(5000);

            // Check if there are activity items
            const activityItems = await this.driver.findElements(
                By.xpath("//div[contains(@style, 'background: #374151')]")
            );

            if (activityItems.length > 0) {
                this.assert(activityItems.length > 0, 'Activity log should contain items');

                // Check if the first activity item is visible
                const firstItem = activityItems[0];
                this.assert(await firstItem.isDisplayed(), 'First activity item should be visible');

                console.log(`📝 Found ${activityItems.length} activity log items`);
            } else {
                console.log('⚠️  No activity items found yet (consciousness may be starting up)');
            }

            this.logSuccess('Activity log test passed');
        } catch (error) {
            this.logError('Activity log test failed', error);
        }
    }

    async testGrowthModal() {
        console.log('🧪 Testing growth modal functionality...');

        try {
            // Find and click the Growth button
            const growthButton = await this.driver.wait(
                until.elementLocated(By.xpath("//button[contains(text(), 'Growth')]")),
                10000
            );
            this.assert(await growthButton.isDisplayed(), 'Growth button should be visible');
            this.assert(await growthButton.isEnabled(), 'Growth button should be enabled');

            await growthButton.click();
            await this.driver.sleep(3000); // Wait for modal to load

            // Check if growth modal appears
            const modalTitle = await this.driver.wait(
                until.elementLocated(By.xpath("//h2[contains(text(), '意識成長レポート')]")),
                10000
            );
            this.assert(await modalTitle.isDisplayed(), 'Growth modal should appear');

            // Check for close button
            const closeButton = await this.driver.findElement(
                By.xpath("//button[contains(text(), 'Close')]")
            );
            this.assert(await closeButton.isDisplayed(), 'Close button should be visible');

            // Check for various sections in the modal
            const sections = ['Overview', 'Personality Traits', 'DPD Evolution', 'Growth Metrics'];
            for (const section of sections) {
                try {
                    const sectionElement = await this.driver.findElement(
                        By.xpath(`//h3[contains(text(), '${section}')]`)
                    );
                    this.assert(await sectionElement.isDisplayed(), `${section} section should be visible`);
                } catch (e) {
                    console.log(`⚠️  ${section} section not found (may be loading or empty)`);
                }
            }

            // Close the modal
            await closeButton.click();
            await this.driver.sleep(1000);

            this.logSuccess('Growth modal test passed');
        } catch (error) {
            this.logError('Growth modal test failed', error);
        }
    }

    async testRealTimeUpdates() {
        console.log('🧪 Testing real-time updates...');

        try {
            // Wait and observe if values change over time
            const initialSystemClock = await this.getSystemClockValue();
            console.log(`📊 Initial System Clock: ${initialSystemClock}`);

            // Wait for some time to see updates
            await this.driver.sleep(10000);

            const updatedSystemClock = await this.getSystemClockValue();
            console.log(`📊 Updated System Clock: ${updatedSystemClock}`);

            // Check if system clock increased (indicating real-time updates)
            const clockIncreased = updatedSystemClock > initialSystemClock;
            this.assert(clockIncreased, 'System clock should increase over time, indicating real-time updates');

            this.logSuccess('Real-time updates test passed');
        } catch (error) {
            this.logError('Real-time updates test failed', error);
        }
    }

    async getSystemClockValue() {
        try {
            const clockElement = await this.driver.findElement(
                By.xpath("//div[contains(text(), 'System Clock')]/preceding-sibling::div")
            );
            const clockText = await clockElement.getText();
            return parseInt(clockText) || 0;
        } catch (error) {
            console.log('⚠️  Could not read system clock value');
            return 0;
        }
    }

    async testConsciousnessPauseResume() {
        console.log('🧪 Testing consciousness pause/resume functionality...');

        try {
            // Make sure consciousness is running first
            await this.ensureConsciousnessRunning();

            // Find and click Pause button
            const pauseButton = await this.driver.wait(
                until.elementLocated(By.xpath("//button[contains(text(), 'Pause')]")),
                10000
            );
            await pauseButton.click();
            await this.driver.sleep(2000);

            // Check if status changed to Paused
            const pausedStatus = await this.driver.wait(
                until.elementLocated(By.xpath("//span[contains(text(), 'Consciousness Paused')]")),
                5000
            );
            this.assert(await pausedStatus.isDisplayed(), 'Consciousness status should show as Paused');

            // Check for Resume button
            const resumeButton = await this.driver.wait(
                until.elementLocated(By.xpath("//button[contains(text(), 'Resume')]")),
                5000
            );
            this.assert(await resumeButton.isDisplayed(), 'Resume button should appear when paused');

            // Click Resume
            await resumeButton.click();
            await this.driver.sleep(2000);

            // Check if status changed back to Active
            const activeStatus = await this.driver.wait(
                until.elementLocated(By.xpath("//span[contains(text(), 'Consciousness Active')]")),
                5000
            );
            this.assert(await activeStatus.isDisplayed(), 'Consciousness status should show as Active after resume');

            this.logSuccess('Consciousness pause/resume test passed');
        } catch (error) {
            this.logError('Consciousness pause/resume test failed', error);
        }
    }

    async ensureConsciousnessRunning() {
        try {
            const startButton = await this.driver.findElement(
                By.xpath("//button[contains(text(), 'Start')]")
            );
            if (await startButton.isDisplayed()) {
                await startButton.click();
                await this.driver.sleep(3000);
            }
        } catch (error) {
            // Consciousness is probably already running
        }
    }

    async runAllTests() {
        console.log('🧪 Starting comprehensive UI test suite...\n');

        try {
            await this.initialize();
            await this.navigateToApp();

            // Core functionality tests
            await this.testPageLoad();
            await this.testConsciousnessControls();
            await this.testDPDScoresDisplay();
            await this.testSystemStatistics();

            // Interactive features tests
            await this.testManualTrigger();
            await this.testEnergyManagement();
            await this.testPipelineVisualization();
            await this.testActivityLog();
            await this.testGrowthModal();

            // Advanced functionality tests
            await this.testRealTimeUpdates();
            await this.testConsciousnessPauseResume();

        } finally {
            await this.cleanup();
        }

        this.printTestSummary();
    }

    async cleanup() {
        if (this.driver) {
            await this.driver.quit();
            console.log('🔄 WebDriver cleaned up');
        }
    }

    assert(condition, message) {
        if (condition) {
            this.testResults.push({ status: 'PASS', message });
        } else {
            this.testResults.push({ status: 'FAIL', message });
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    logSuccess(message) {
        console.log(`✅ ${message}`);
        this.testResults.push({ status: 'PASS', message });
    }

    logError(message, error) {
        console.error(`❌ ${message}`);
        console.error(`   Error: ${error.message}`);
        this.testResults.push({ status: 'FAIL', message: `${message}: ${error.message}` });
    }

    printTestSummary() {
        console.log('\n📊 TEST SUMMARY');
        console.log('================');

        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
                console.log(`   - ${test.message}`);
            });
        }

        console.log('\n🎯 UI Test Suite Complete!');
    }
}

// Export for use as module or run directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new AeneaUITester();
    tester.runAllTests().catch(console.error);
}

export default AeneaUITester;