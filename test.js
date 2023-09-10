const fs = require('fs');
const readline = require('readline');
const Table = require('cli-table');
const chalk = require('chalk');

// Function to process a log file and return time series data
function processLogFile(filename) {
  const timeSeriesData = {};

  const readStream = readline.createInterface({
    input: fs.createReadStream(filename),
    output: process.stdout,
    terminal: false,
  });

  readStream.on('line', (line) => {
    // Parse each log line using a regex pattern
    const logPattern = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2} \+\d{2}:\d{2}):.*"(\w+) ([^\s]+) [^"]+" (\d+) \d+ "-" "(.+)"/;
    const match = line.match(logPattern);

    if (match) {
      const [, timestamp, http_request_type, endpoint, status_code, user_agent] = match;
      
      // Extract the hour and minute from the timestamp
      const [hour, minute] = timestamp.split(' ')[1].split(':').map(Number);
      
      // Create a time series key (e.g., "2023-07-06 17:13")
      const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Initialize or increment the count for the time key
      if (!timeSeriesData[timeKey]) {
        timeSeriesData[timeKey] = { timestamp: timeKey, count: 1, statusCodes: {} };
      } else {
        timeSeriesData[timeKey].count++;
      }
      
      // Initialize or increment the status code count for the time key
      if (!timeSeriesData[timeKey].statusCodes[status_code]) {
        timeSeriesData[timeKey].statusCodes[status_code] = 1;
      } else {
        timeSeriesData[timeKey].statusCodes[status_code]++;
      }

      // Initialize or increment the endpoint count
      if (!timeSeriesData[timeKey].endpoints) {
        timeSeriesData[timeKey].endpoints = {};
      }
      if (!timeSeriesData[timeKey].endpoints[endpoint]) {
        timeSeriesData[timeKey].endpoints[endpoint] = 1;
      } else {
        timeSeriesData[timeKey].endpoints[endpoint]++;
      }

    }
  });

  return new Promise((resolve) => {
    readStream.on('close', () => {
      resolve(timeSeriesData);
    });
  });
}

// Define a map of status codes to status names
const statusNames = {
    '200': 'OK',
    '404': 'Not Found',
    '206': 'Partial Content',
    '500': 'Internal Server Error',
    '422': 'Unprocessable Content',
    '400': 'Bad Request',
    '401': 'Unauthorized'
    // Add more status codes and their names as needed
  };  


// Function to display data in a table
function displayTable(header, data) {
  const table = new Table({
    head: header,
  });

  for (const item of data) {
    table.push(item);
  }

  console.log(table.toString());
}


// Process each log file and merge the results
async function main() {
  const logFiles = [
    { name: 'api-dev-out.log', content: fs.readFileSync('api-dev-out.log', 'utf8') },
    { name: 'api-prod-out.log', content: fs.readFileSync('api-prod-out.log', 'utf8') },
    { name: 'prod-api-prod-out.log', content: fs.readFileSync('prod-api-prod-out.log', 'utf8') },
  ]; // Replace with your log file names and content

  const combinedTimeSeriesData = {};

  for (const { name, content } of logFiles) {
    // Create a temporary log file to process the content
    fs.writeFileSync(name, content, 'utf8');

    const timeSeriesData = await processLogFile(name);

    // Merge the data from this file into the combined dataset
    for (const timeKey in timeSeriesData) {
      if (!combinedTimeSeriesData[timeKey]) {
        combinedTimeSeriesData[timeKey] = timeSeriesData[timeKey];
      } else {
        combinedTimeSeriesData[timeKey].count += timeSeriesData[timeKey].count;

        // Merge status code counts
        for (const statusCode in timeSeriesData[timeKey].statusCodes) {
          if (!combinedTimeSeriesData[timeKey].statusCodes[statusCode]) {
            combinedTimeSeriesData[timeKey].statusCodes[statusCode] = timeSeriesData[timeKey].statusCodes[statusCode];
          } else {
            combinedTimeSeriesData[timeKey].statusCodes[statusCode] += timeSeriesData[timeKey].statusCodes[statusCode];
          }
        }

        // Merge endpoint counts
        if (!combinedTimeSeriesData[timeKey].endpoints) {
            combinedTimeSeriesData[timeKey].endpoints = timeSeriesData[timeKey].endpoints;
          } else {
            for (const endpoint in timeSeriesData[timeKey].endpoints) {
              if (!combinedTimeSeriesData[timeKey].endpoints[endpoint]) {
                combinedTimeSeriesData[timeKey].endpoints[endpoint] = timeSeriesData[timeKey].endpoints[endpoint];
              } else {
                combinedTimeSeriesData[timeKey].endpoints[endpoint] += timeSeriesData[timeKey].endpoints[endpoint];
              }
            }
        }
      }
    }
  }

  // Convert the combined data into an array of time series entries
  const timeSeriesArray = Object.values(combinedTimeSeriesData);

  // Sort the time series data by timestamp
  timeSeriesArray.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Find which endpoint is called how many times
  const endpointData = {};
  for (const entry of timeSeriesArray) {
    if (entry.endpoints) {
      for (const endpoint in entry.endpoints) {
        if (!endpointData[endpoint]) {
          endpointData[endpoint] = entry.endpoints[endpoint];
        } else {
          endpointData[endpoint] += entry.endpoints[endpoint];
        }
      }
    }
  }

  const sortedEndpoints = Object.entries(endpointData).sort((a, b) => b[1] - a[1]);
  displayTable(['Endpoint', 'Call Count'], sortedEndpoints);

  // Find how many API calls were being made on a per-minute basis
  const perMinuteData = timeSeriesArray.map(({ timestamp, count }) => [timestamp, count]);
  displayTable(['Time', 'Call Count'], perMinuteData);

  // Find how many API calls are there in total for each HTTP status code
  const statusCodeData = {};
  for (const entry of timeSeriesArray) {
    if (entry.statusCodes) {
      for (const statusCode in entry.statusCodes) {
        if (!statusCodeData[statusCode]) {
          statusCodeData[statusCode] = entry.statusCodes[statusCode];
        } else {
          statusCodeData[statusCode] += entry.statusCodes[statusCode];
        }
      }
    }
  }

  const statusCodeArray = Object.entries(statusCodeData).sort((a, b) => b[1] - a[1]);
  // Display the results in a table with status code names
  const statusWithNameArray = statusCodeArray.map(([statusCode, count]) => {
    // Convert the status code to its corresponding name
    const statusName = statusNames[statusCode] || statusCode;
    return [statusName, statusCode, count];
  });
  displayTable(['Index', 'Status Code', 'Call Count'], statusWithNameArray);
}

main();
