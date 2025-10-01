/**
 * Aenea UI API Tests - Lightweight UI verification
 * Tests the UI endpoints and API functionality without browser automation
 */

// Using Node.js built-in fetch (Node 18+)

class AeneaUIAPITester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = [];
    }

    async testUIAvailability() {
        console.log('🧪 Testing UI availability...');

        try {
            const response = await fetch(this.baseUrl);
            const html = await response.text();

            this.assert(response.status === 200, 'UI should return HTTP 200');
            this.assert(html.includes('Aenea'), 'UI should contain "Aenea" in title');
            this.assert(html.includes('Consciousness Dashboard'), 'UI should contain consciousness dashboard');
            this.assert(html.includes('React'), 'UI should load React framework');
            this.assert(html.includes('socket.io'), 'UI should include Socket.IO for real-time updates');

            this.logSuccess('UI availability test passed');
        } catch (error) {
            this.logError('UI availability test failed', error);
        }
    }

    async testConsciousnessAPI() {
        console.log('🧪 Testing consciousness API endpoints...');

        try {
            // Test consciousness state endpoint
            const stateResponse = await fetch(`${this.baseUrl}/api/consciousness/state`);
            this.assert(stateResponse.status === 200, 'Consciousness state endpoint should return 200');

            const stateData = await stateResponse.json();
            this.assert(typeof stateData.isRunning === 'boolean', 'State should include isRunning boolean');
            this.assert(typeof stateData.isPaused === 'boolean', 'State should include isPaused boolean');

            console.log(`📊 Consciousness State: Running=${stateData.isRunning}, Paused=${stateData.isPaused}`);

            // Test statistics endpoint
            const statsResponse = await fetch(`${this.baseUrl}/api/consciousness/statistics`);
            this.assert(statsResponse.status === 200, 'Statistics endpoint should return 200');

            const statsData = await statsResponse.json();
            this.assert(typeof statsData.totalQuestions === 'number', 'Stats should include totalQuestions');
            this.assert(typeof statsData.totalThoughts === 'number', 'Stats should include totalThoughts');

            console.log(`📊 Stats: Questions=${statsData.totalQuestions}, Thoughts=${statsData.totalThoughts}`);

            this.logSuccess('Consciousness API test passed');
        } catch (error) {
            this.logError('Consciousness API test failed', error);
        }
    }

    async testDPDAPI() {
        console.log('🧪 Testing DPD API endpoints...');

        try {
            // Test DPD scores endpoint (correct path)
            const dpdResponse = await fetch(`${this.baseUrl}/api/consciousness/dpd`);
            this.assert(dpdResponse.status === 200, 'DPD endpoint should return 200');

            const dpdData = await dpdResponse.json();
            this.assert(typeof dpdData.empathy === 'number', 'DPD should include empathy score');
            this.assert(typeof dpdData.coherence === 'number', 'DPD should include coherence score');
            this.assert(typeof dpdData.dissonance === 'number', 'DPD should include dissonance score');

            console.log(`📊 DPD Scores: E=${dpdData.empathy.toFixed(3)}, C=${dpdData.coherence.toFixed(3)}, D=${dpdData.dissonance.toFixed(3)}`);

            // Test DPD scores legacy endpoint
            const scoresResponse = await fetch(`${this.baseUrl}/api/consciousness/dpd/scores`);
            this.assert(scoresResponse.status === 200, 'DPD scores endpoint should return 200');

            const scoresData = await scoresResponse.json();
            this.assert(typeof scoresData.weightedTotal === 'number', 'DPD scores should include weighted total');

            console.log(`📊 DPD Weighted Total: ${scoresData.weightedTotal.toFixed(3)}`);

            this.logSuccess('DPD API test passed');
        } catch (error) {
            this.logError('DPD API test failed', error);
        }
    }

    async testGrowthAPI() {
        console.log('🧪 Testing growth API endpoints...');

        try {
            // Test growth full data
            const growthResponse = await fetch(`${this.baseUrl}/api/growth/full`);
            this.assert(growthResponse.status === 200, 'Growth endpoint should return 200');

            const growthData = await growthResponse.json();
            this.assert(typeof growthData === 'object', 'Growth data should be an object');

            console.log(`📊 Growth Data: Available sections: ${Object.keys(growthData).join(', ')}`);

            this.logSuccess('Growth API test passed');
        } catch (error) {
            this.logError('Growth API test failed', error);
        }
    }

    async testEventStreamEndpoint() {
        console.log('🧪 Testing event stream endpoint...');

        try {
            // Test that the events endpoint exists (we can't easily test SSE in simple fetch)
            const eventsResponse = await fetch(`${this.baseUrl}/api/consciousness/events`);

            // EventSource endpoints typically return chunked data, so we just check it doesn't error
            this.assert(eventsResponse.status === 200, 'Events endpoint should be accessible');

            console.log('📊 Event stream endpoint is accessible');

            this.logSuccess('Event stream test passed');
        } catch (error) {
            this.logError('Event stream test failed', error);
        }
    }

    async testManualTriggerAPI() {
        console.log('🧪 Testing manual trigger API...');

        try {
            // Test manual trigger endpoint
            const triggerData = {
                question: 'Test question: What is the nature of testing consciousness?'
            };

            const triggerResponse = await fetch(`${this.baseUrl}/api/consciousness/trigger`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(triggerData)
            });

            this.assert(triggerResponse.status === 200, 'Manual trigger should return 200');

            const triggerResult = await triggerResponse.json();
            this.assert(triggerResult.success === true, 'Manual trigger should indicate success');

            console.log('📊 Manual trigger sent successfully');

            this.logSuccess('Manual trigger API test passed');
        } catch (error) {
            this.logError('Manual trigger API test failed', error);
        }
    }

    async testEnergyAPI() {
        console.log('🧪 Testing energy management API...');

        try {
            // Test energy recharge
            const rechargeResponse = await fetch(`${this.baseUrl}/api/consciousness/recharge-energy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: 10 })
            });

            this.assert(rechargeResponse.status === 200, 'Energy recharge should return 200');

            const rechargeResult = await rechargeResponse.json();
            console.log(`📊 Energy recharge result: ${rechargeResult.message || 'Success'}`);

            // Test deep rest
            const restResponse = await fetch(`${this.baseUrl}/api/consciousness/deep-rest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            this.assert(restResponse.status === 200, 'Deep rest should return 200');

            const restResult = await restResponse.json();
            console.log(`📊 Deep rest result: ${restResult.message || 'Success'}`);

            this.logSuccess('Energy API test passed');
        } catch (error) {
            this.logError('Energy API test failed', error);
        }
    }

    async testConsciousnessControls() {
        console.log('🧪 Testing consciousness control API...');

        try {
            // Get current state first
            const initialStateResponse = await fetch(`${this.baseUrl}/api/consciousness/state`);
            const initialState = await initialStateResponse.json();

            console.log(`📊 Initial consciousness state: Running=${initialState.isRunning}, Paused=${initialState.isPaused}`);

            // Test pause if running
            if (initialState.isRunning && !initialState.isPaused) {
                const pauseResponse = await fetch(`${this.baseUrl}/api/consciousness/pause`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                this.assert(pauseResponse.status === 200, 'Pause should return 200');

                // Wait a moment then resume
                await new Promise(resolve => setTimeout(resolve, 2000));

                const resumeResponse = await fetch(`${this.baseUrl}/api/consciousness/resume`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                this.assert(resumeResponse.status === 200, 'Resume should return 200');

                console.log('📊 Pause/Resume cycle completed');
            } else if (!initialState.isRunning) {
                // Test start if not running
                const startResponse = await fetch(`${this.baseUrl}/api/consciousness/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                this.assert(startResponse.status === 200, 'Start should return 200');

                console.log('📊 Consciousness started');
            }

            this.logSuccess('Consciousness controls test passed');
        } catch (error) {
            this.logError('Consciousness controls test failed', error);
        }
    }

    async runAllTests() {
        console.log('🧪 Starting UI API test suite...\n');

        try {
            // Basic availability tests
            await this.testUIAvailability();

            // API functionality tests
            await this.testConsciousnessAPI();
            await this.testDPDAPI();
            await this.testGrowthAPI();
            await this.testEventStreamEndpoint();

            // Interactive functionality tests
            await this.testManualTriggerAPI();
            await this.testEnergyAPI();
            await this.testConsciousnessControls();

        } catch (error) {
            console.error('❌ Test suite encountered an error:', error);
        }

        this.printTestSummary();
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
        console.log('\n📊 UI API TEST SUMMARY');
        console.log('=======================');

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

        console.log('\n🎯 UI API Test Suite Complete!');
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new AeneaUIAPITester();
    tester.runAllTests().catch(console.error);
}

export default AeneaUIAPITester;