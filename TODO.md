
// ############################################################
// update in lavorazione

- aggiungere un contatore incrementato ad ogni messaggio che influisce la possibilità di drop (magari di 0.0002)
- aggiungere modulo per gestire dei "riddles", piccole domande casuali a cui bisogna rispondere per testo tipo: 4+8-5+2 = ?
- aggiungere nei "settings" la possibilità di disattivare i dungeon / monster / riddles
- aggiunta delle "stagioni" per resettare il punteggio delle challenge
  - quando un user raggiunge i 100 punti la stagione termina
  - verranno premiati i giocatori al primo, secondo e terzo posto con 100epm / 75epm / 50epm 

// ############################################################
// futuri update

- creazione di un modulo "core" dove spostare tutti metodi a funzionalità relative al bot telegram 
  così da lasciare nel file app.js solo la parte di inizializzazione 
- sistema di coda per i messaggi con il bot
- azione /su per triggerare un evento
- migliorare alcune azioni del comando /su:  "/su deletechat 1234" "/su clearall"