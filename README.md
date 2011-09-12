uCheck (node.js backend)
======
 
uCheck automatiseert ingewikkelde stappen op uSis. Zodat Leidse studenten zich makkelijker kunnen inschrijven voor studieonderdelen en sneller hun cijfers kunnen controleren.
 
Install
-------
1.	Installeer [node.js](https://github.com/joyent/node/wiki)
2.	Installeer [npm](https://github.com/isaacs/npm): 

		curl http://npmjs.org/install.sh | sh
	
3.	Installeer de benodigde modules:
	
		npm install express htmlparser soupselect
	
4.	Start de server
	
		node server.js
 
5.	Check of het werkt op
	
		http://localhost:3000/
		
	Als het werkt krijg je een "OK"
	
API
---
	
**Cijfers in JSON**

	http://localhost:3000/cijfers/<s0000000>/<wachtwoord>/
	
**Inschrijvingen in JSON**

	http://localhost:3000/inschrijvingen/<s0000000>/<wachtwoord>/<jaar>/

*	*Jaar = 10* voor inschrijvingen in 2010-2011
*	*Jaar = 11* voor inschrijvingen in 2011-2012
		 
**Voortgang in HTML**

	http://localhost:3000/cijfers/<s0000000>/<wachtwoord>/	 
		
**Asynchroon**

	http://localhost:3000/cijfers_token/<s0000000>/<wachtwoord>/	
	http://localhost:3000/inschrijvingen_token/<s0000000>/<wachtwoord>/<jaar>/

Bewaar de token, roep later dan deze call aan:

	http://localhost:3000/token/<token>/
	
De JSON van cijfers en inschrijvingen worden een minuut bewaard. Als de token niet aanwezig is krijg je "invalid token" terug.
Als de JSON nog niet gedownload is blijft de connectie 'alive' tot de JSON wordt gestuurd.
		 
Servers
-------

uCheck.nl draait op 2 servers. Eén met een php-backend en de ander met een node.js (serverside javascript) backend.

De php-backend regelt:

*	De front-end van uCheck (html, css, javascript)
*	Het inschrijven/uitschrijven
*	Elke nacht worden de vakken van alle studies gedownload om lokaal te cachen
*	De api voor de uCheck iOS app

De node.js-backend regelt:

*	Het scrapen van de cijfers, inschrijvingen naar JSON
*	Het scrapen van de voortgang naar HTML (wordt geparst door de php-backend)

Ik heb 2 node.js servers staan. 

1.	Amazon (Ierland): [`http://ec2-79-125-78-169.eu-west-1.compute.amazonaws.com:3000/`](http://ec2-79-125-78-169.eu-west-1.compute.amazonaws.com:3000/)
2.	Nodester: [`http://ucheck.nodester.com/`](http://ucheck.nodester.com/)

Niet inbegrepen
---------------

Op mijn servers is nog de module 'Prowl' aanwezig, enkele verwijzingen staan nog in de code. Met Prowl kan ik errors pushen naar mijn telefoon.