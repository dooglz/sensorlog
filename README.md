# sensorlog
nodejs module for logging and averaging numeric stats

- Want to store numeric data and do moving averages per minute/hour/day/month/year?
- Want to store this from multiple sensors and have cummulative averages?

Then this module is for you. Contributions and improvements welcome.

Ideal usecase, saving cpu usage %, power Wattage, temperature from multiple sources. 

This module will save to and upkeep a json varaible/file with the data, calulate averages, and prune old data down.
