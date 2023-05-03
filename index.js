const puppeteer = require("puppeteer");
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        ignoreDefaultArgs: ["--disable-extensions"],
        headless: false,
        slowMo: 0,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });


    async function fetchContent(sRollCode, aRollNum) {
        const qq = await page.$("#txtRoleCode");
        await qq.type(sRollCode);

        const qqq = await page.$("#txtrollno");
        await qqq.type(aRollNum);

        const qqqwwer = await page.$("#queryString");
        let value = await qqqwwer.evaluate((el) => el.textContent);

        value = value.replace("=", "");
        const y = value.split("+");
        const res = Number(y[0]) + Number(y[1]);

        const qsaf = await page.$("#result");
        await qsaf.type(res.toString());

        const asd = await page.$('[class="btn btn-danger"]');
        await asd.click();

        await page.waitForNavigation();

        return page.evaluate(() => {
            const rows = document.querySelectorAll("table")[1].querySelectorAll("tr");
            const jsonObj = {};

            for (let i = 0; i < rows.length; i++) {
                // Collect All Basic Candidate Info
                if (i >= 0 && i <= 6) {
                    const cols = Array.from(rows[i].querySelectorAll("td"));
                    try {
                        jsonObj[cols[0].innerText] = cols[1].innerText;
                    } catch (error) {
                        continue;
                    }

                    continue;
                }

                // Skip 2 Unsed Rows
                if (i === 7 || i === 8) continue;

                // Collect Subject Full / Obtained Marks
                const marksFiller = (index) => {
                    const cols = Array.from(rows[index].querySelectorAll("td"));

                    const subName = cols[0].innerText;
                    const fullMarks = cols[1].innerText;
                    const obTainedMarks = cols[cols.length - 1].innerText;

                    jsonObj[subName + " | Full Mark"] = fullMarks;
                    jsonObj[subName + " | Obtaned Mark"] = obTainedMarks;
                }

                while (rows[i].getAttribute("runat") === "server") {
                    try {
                        marksFiller(i++);
                    } catch (error) {
                        break;
                    }
                }

                // Fill English Mark which is 2 rows ahead
                try {
                    marksFiller(i+=2);
                } catch (error) {
                    continue;
                }

                // Select Previous Rows To Collect (Total / Division)
                const cols = Array.from(rows[i - 1].querySelectorAll("td"));

                try {
                    jsonObj[cols[0].innerText] = cols[1].innerText;
                    jsonObj[cols[2].innerText] = cols[3].innerText;
                } catch (error) {
                    continue;
                }

                break;
            }

            return jsonObj;
        });
    }


    const URL = "http://matricbseb.com/";
    const rollCode = "0000000000000000";
    // Get All Roll Num From File [Array]
    var rollNum = fs.readFileSync('roll.txt', 'utf8').split('\n');

    //------ Main Program ---------//
    const finalJsonData = [];

    const page = await browser.newPage();

    for (k = 0; k < rollNum.length; k++) {
        console.log("Proces Number = " + (k + 1) + " || Roll Num = " + rollNum[k]);
        await page.goto(URL);
        const fetchedData = await fetchContent(rollCode, rollNum[k]);
        finalJsonData.push(fetchedData);
    }

    // Store Data After All Operation
    const fileName = ("BSEB-Result" + new Date().toJSON() + ".json").replaceAll(":", "");

    fs.writeFileSync(fileName, JSON.stringify(finalJsonData));
})();