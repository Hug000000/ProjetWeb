create sequence public.utilisateurs_idutilisateur_seq
    as integer;
alter sequence public.utilisateurs_idutilisateur_seq owner to postgres;

create sequence public.photo_idphoto_seq
    as integer;
alter sequence public.photo_idphoto_seq owner to postgres;

create sequence public.avis_idavis_seq
    as integer;
alter sequence public.avis_idavis_seq owner to postgres;

create sequence public.message_idmessage_seq
    as integer;
alter sequence public.message_idmessage_seq owner to postgres;

create sequence public.trajet_idtrajet_seq
    as integer;
alter sequence public.trajet_idtrajet_seq owner to postgres;

create sequence public.estpassager_idestpassager_seq
    as integer;
alter sequence public.estpassager_idestpassager_seq owner to postgres;

create table if not exists public.utilisateurs
(
    idutilisateur varchar default nextval('utilisateurs_idutilisateur_seq'::regclass) not null
        primary key,
    nom           varchar                                                             not null,
    prenom        varchar							      not null,
    age           integer                                                             not null,
    username      varchar                                                             not null,
    numtel        varchar                                                             not null,
    photoprofil   varchar
        constraint utilisateurs_photo_idphoto
            references public.photo,
    estadmin      boolean                                                             not null,
    motdepasse    varchar                                                             not null
);

alter table public.utilisateurs
    owner to postgres;

alter sequence public.utilisateurs_idutilisateur_seq owned by public.utilisateurs.idutilisateur;

create table if not exists public.photo
(
    idphoto varchar default nextval('photo_idphoto_seq'::regClass) not null
        primary key,
    image   varchar
)

alter table public.photo
    owner to postgres;

alter sequence public.photo_idphoto_seq owned by public.photo.idphoto;

create table if not exists public.voiture
(
    marque       varchar not null,
    modele       varchar not null,
    couleur      varchar not null,
    plaqueimat   varchar not null
        constraint voiture_pk
            primary key,
    proprietaire varchar not null
        constraint voiture_utilisateurs_idutilisateur_fk
            references public.utilisateurs
);

alter table public.voiture
    owner to postgres;

create table if not exists public.avis
(
    note                     integer                                              not null,
    date                     date                                                 not null,
    texte                    varchar                                              not null,
    idavis                   varchar default nextval('avis_idavis_seq'::regclass) not null
        constraint avis_pk
            primary key,
    envoyeur                 varchar                                              not null
        constraint avis_utilisateurs_idutilisateur_fk
            references public.utilisateurs,
    receveur                 varchar                                              not null
        constraint avis_utilisateurs_idutilisateur_fk_2
            references public.utilisateurs
);

alter table public.avis
    owner to postgres;

alter sequence public.avis_idavis_seq owned by public.avis.idavis;

create table if not exists public.message
(
    idmessage varchar default nextval('message_idmessage_seq'::regclass) not null
        constraint message_pk
            primary key,
    date      date                                                       not null,
    texte     varchar                                                    not null,
    envoyeur  varchar                                                    not null
        constraint message_utilisateurs_idutilisateur_fk
            references public.utilisateurs,
    receveur  varchar                                                    not null
        constraint message_utilisateurs_idutilisateur_fk_2
            references public.utilisateurs
);

alter table public.message
    owner to postgres;

alter sequence public.message_idmessage_seq owned by public.message.idmessage;

create table if not exists public.trajet
(
    idtrajet     varchar default nextval('trajet_idtrajet_seq'::regclass) not null
        constraint trajet_pk
            primary key,
    villedepart  varchar                                                  not null,
    villearrivee varchar                                                  not null,
    heuredepart  date                                                     not null,
    heurearrivee date                                                     not null,
    prix         numeric                                                  not null,
    conducteur   varchar                                                  not null
        constraint trajet_utilisateurs_idutilisateur_fk
            references public.utilisateurs
);

alter table public.trajet
    owner to postgres;

alter sequence public.trajet_idtrajet_seq owned by public.trajet.idtrajet;

create table if not exists public.estpassager
(
    trajet        varchar							     not null
        constraint estpassager_trajet_idtrajet_fk
            references public.trajet,
    passager      varchar							     not null
        constraint estpassager_utilisateurs_idutilisateur_fk
            references public.utilisateurs,
    idestpassager varchar default nextval('estpassager_idestpassager_seq'::regclass) not null
        constraint estpassager_pk
            primary key
);

alter table public.estpassager
    owner to postgres;

alter sequence public.estpassager_idestpassager_seq owned by public.estpassager.idestpassager;
