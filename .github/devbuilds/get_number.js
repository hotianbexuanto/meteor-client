import fetch from 'node-fetch';

fetch("https://meteorclient.com/api/stats")
    .then(res => res.json())
    .then(res => {
        const nextBuildNumber = (parseInt(res.devBuild) + 1) || 1;
        console.log("number=" + nextBuildNumber);
    })
    .catch(err => {
        console.error("Error fetching build number:", err);
        console.log("number=1"); // 如果出错，返回默认值 1
    });
