const axios = require('axios');
const { Pool } = require('pg');
const querystring = require('querystring');

const tokenEndpoint = 'http://64.227.144.217/api/authorize/access_token';
const clientID = '3351c222175c956648ffc2ef36befb29dd30baf3';
const clientSecret = 'd3c7772b64fbb55a3d0b0245f2f0a0a1e96eed523f6e7166e09d7f46e7f2fe8df92153301d3421fe86a051d8044d0545924845274cc1239a661054a2f4d4312da78ac5935b2d67158c2f276d247fbb04f4446740b98cecc4a15bc9e49943543984c885ba29bec155067e5e2ddc4c5d7925a5475372157d1dcda3a4f07a68ee';
const pool = new Pool({
    user: "postgres",
    host: 'db.mgampbhmlnalxohuobpr.supabase.co',
    database: "postgres",
    password: 'gplVhDuxLDMeBKxs',
    port: 5432,
});

let accessToken;
let day = String(new Date().getDate()).padStart(2, "0");
let year = new Date().getFullYear();
let month = String(new Date().getMonth() + 1).padStart(2, "0");

async function getAccessToken() {
    const requestBody = {
        grant_type: 'client_credentials',
        client_id: clientID,
        client_secret: clientSecret
    };
    const response = await axios.post(tokenEndpoint, querystring.stringify(requestBody), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    accessToken = response.data.access_token;
    getdata();
}

async function getdata() {
    console.log("ACCESS TOKEN LOG :: ", accessToken);

    let stoploop = ['initial value'];
    let increment = 0;
    let displayCount = 0;
    let arr = [];

    const options = {
        'method': 'GET',
        'headers': {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    while (stoploop.length) {
        const response = await axios(`http://64.227.144.217/api/display?start=${increment}`, options)
        increment += 10;
        if (!response.data.length) {
            stoploop = [];
        }
        response.data.forEach(element => {
            arr.push(element);
        })
    }
    console.log(`Array Length :: ${arr.length}`);

    arr?.map((elm) => {
        // console.log(`${elm?.displayId} ${elm?.display} ${elm?.loggedIn}`);

        if (elm.loggedIn == 1) {
            displayCount = 1;
        }
        pool.query(`INSERT INTO ystraw_data_table (unique_id, custom_date, display_id, display_name, display_count, last_accessed) VALUES ('TW-${elm.displayId}-${year}-${month}-${day}', '${year}-${month}-${day}', '${elm.displayId}', '${elm.display}', ${elm.loggedIn}, '${elm.lastAccessed}') ON CONFLICT (unique_id) DO UPDATE SET custom_date = '${year}-${month}-${day}', display_id = '${elm.displayId}', display_name = '${elm.display}', display_count = ystraw_data_table.display_count + ${displayCount}, last_accessed = '${elm.lastAccessed}'`, (err, data) => {
            if (err) {
                console.log(err);
            }
        });

        displayCount = 0;
    })

    console.log(`ALL DATA INSERTED :: (${year}-${month}-${day})`);
}

getAccessToken();