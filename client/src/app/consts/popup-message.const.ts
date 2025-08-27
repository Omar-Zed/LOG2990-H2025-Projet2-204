export enum PopupMessage {
    DeleteGame = 'Êtes-vous sûr de vouloir supprimer le jeu :',
    Quit = 'Voulez-vous vraiment quitter ?',
    QuitEditPage = 'Voulez-vous vraiment quitter la page? Les modifications non sauvegardées seront perdues.',
    SuccessfulSave = 'Jeu sauvegardé avec succès',
    CancelModification = 'Voulez-vous vraiment annuler les modifications?',
    GameDoesNotExist = "Le jeu n'existe pas !",
    ErrorFetchingGame = 'Erreur lors de la récupération du jeu !',
    ErrorLoadingGames = 'Erreur lors du chargement des jeux !',
    Surrender = 'Voulez-vous vraiment abandonner ?',
    ConnectionError = 'Erreur de connection avec le serveur',
    NameAlreadyExists = 'Le nom est déjà utilisé. Veuillez en choisir un autre.',
}

export const KEYWORDS_TO_REPLACE = ['debug'];
