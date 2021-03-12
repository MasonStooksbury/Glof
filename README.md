# Glof
![](https://img.shields.io/github/stars/MasonStooksbury/Glof)
![](https://img.shields.io/github/forks/MasonStooksbury/Glof)
![](https://img.shields.io/github/license/MasonStooksbury/Glof)
![](https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2FMasonStooksbury%2FGlof)

An Angular implementation of the classic card game "Six Card Golf".  I named this "Glof" because the rules that we play with deviate from the original game that it's really not even the same game, but slightly resembles it. My wife and I play this game all the time, and this project helps us play wherever we are!

NOTE: Install instructions below pictures

Check out alllll the good details over [here on my website!](https://masonstooksbury.wixsite.com/portfolio/glof)



1. Welcome screen on mobile:
    1. ![welcome-screen](https://github.com/MasonStooksbury/Glof/blob/master/demo-pictures/welcome-screen.jpg)
2. Choose card back screen on mobile:
    1. ![choose-card-back](https://github.com/MasonStooksbury/Glof/blob/master/demo-pictures/choose-card-back.jpg)
3. In-game on mobile:
    1. ![phone-exampl](https://github.com/MasonStooksbury/Glof/blob/master/demo-pictures/phone-example.jpg)
4. In-game on desktop:
    1. ![glof-demo-new](https://github.com/MasonStooksbury/Glof/blob/master/demo-pictures/glof-demo-new.png)


Until I find a solid hosting solution, here are the instructions for installing and playing on your own local network:
- Clone the project
- Download Node.js ![from here](https://nodejs.org/en/download/)
- Download Angular CLI by opening a terminal and running: *npm install -g @angular/cli*
- Navigate into the "glof" directory and run: *npm install*
- Navigate into the "glof-server" directory and run: *npm install*
- Open the "app.component.ts" file and change the IP address to match the IP address of the machine you want to host from (leave the port alone)
- Open a second terminal and navigate to "glof-server" (in the first terminal, navigate back to "glof")
- In the glof-server terminal, run: *node server.js*
- In the glof terminal, run: *ng serve --host <IP address of host machine>*
- Now on your computer or phone, open up your browser and go to: *<IP address>:4200* (e.g. 192.168.1.64:4200)
