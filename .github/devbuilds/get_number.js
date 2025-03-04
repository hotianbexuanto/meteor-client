import fetch from 'node-fetch';

const DEFAULT_BUILD_NUMBER = 1;

try {
    const response = await fetch("https://meteorclient.com/api/stats");
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const buildNumber = parseInt(data.devBuild);
    
    if (isNaN(buildNumber)) {
        console.log(`number=${DEFAULT_BUILD_NUMBER}`);
    } else {
        console.log(`number=${buildNumber + 1}`);
    }
} catch (error) {
    console.error('Error fetching build number:', error);
    console.log(`number=${DEFAULT_BUILD_NUMBER}`);
}
