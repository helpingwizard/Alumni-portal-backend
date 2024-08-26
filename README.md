# PASC_ALUMNI_BACKEND_2.0

## Getting Started
To get a local copy of this template up and running on your machine, follow these simple steps.

### Prerequisites
- Docker

#### For Linux System:
To install Docker, run the following commands in your terminal:

- ``curl -fsSL https://get.docker.com -o get-docker.sh``
- ``sudo sh get-docker.sh``
 
### Installation
- Clone the repo `git clone https://github.com/PICT-ACM-Student-Chapter/Pasc_Backend_Alumni_2.0.git`
- Change the current directory to the template `cd Pasc_Backend_Alumni_2.0`
#### Development Environment
- To get started with development first build the dev containers using the following command `docker-compose -f docker-compose.dev.yml build`
- The env file being used for development is called `.env.dev`
- Run the containers using the command `docker-compose -f docker-compose.dev.yml up`
#### Installing new npm packages
- New packages can be installed through your preferred terminal using the normal `npm i` command following which the containers need to be rebuild for the app to start working again.


