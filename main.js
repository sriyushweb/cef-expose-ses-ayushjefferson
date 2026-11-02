/* Exposé C de SES : le rôle des centres éducatifs fermés
   Script commun. Le site reste lisible sans JavaScript :
   sans script, tous les contenus sont affichés les uns sous les autres. */

(function () {
  "use strict";

  var racine = document.documentElement;
  racine.classList.remove("js-off");
  racine.classList.add("js");

  /* Retire les accents et met en minuscules (pour la recherche du glossaire). */
  function normaliser(texte) {
    return texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* ---------- Menu sur téléphone ---------- */
  var boutonMenu = document.querySelector(".bouton-menu");
  var nav = document.getElementById("navigation");
  if (boutonMenu && nav) {
    boutonMenu.addEventListener("click", function () {
      var ouvert = nav.classList.toggle("est-ouvert");
      boutonMenu.setAttribute("aria-expanded", ouvert ? "true" : "false");
      boutonMenu.textContent = ouvert ? "Fermer le menu" : "Menu";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("est-ouvert")) {
        nav.classList.remove("est-ouvert");
        boutonMenu.setAttribute("aria-expanded", "false");
        boutonMenu.textContent = "Menu";
        boutonMenu.focus();
      }
    });
  }

  /* ---------- Onglets (page Les rôles) ---------- */
  document.querySelectorAll("[data-onglets]").forEach(function (bloc) {
    var onglets = Array.prototype.slice.call(bloc.querySelectorAll('[role="tab"]'));
    var panneaux = onglets.map(function (o) {
      return document.getElementById(o.getAttribute("aria-controls"));
    });

    function choisir(index, donnerFocus, majAdresse) {
      onglets.forEach(function (o, i) {
        var actif = i === index;
        o.setAttribute("aria-selected", actif ? "true" : "false");
        o.tabIndex = actif ? 0 : -1;
        panneaux[i].hidden = !actif;
      });
      if (donnerFocus) onglets[index].focus();
      if (majAdresse && window.history && history.replaceState) {
        history.replaceState(null, "", "#" + panneaux[index].id);
      }
    }

    onglets.forEach(function (o, i) {
      o.addEventListener("click", function () { choisir(i, false, true); });
      o.addEventListener("keydown", function (e) {
        var cible = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") cible = (i + 1) % onglets.length;
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") cible = (i - 1 + onglets.length) % onglets.length;
        if (e.key === "Home") cible = 0;
        if (e.key === "End") cible = onglets.length - 1;
        if (cible !== null) { e.preventDefault(); choisir(cible, true, true); }
      });
    });

    /* Boutons « rôle suivant / précédent » à l'intérieur des panneaux */
    bloc.querySelectorAll("[data-aller]").forEach(function (lien) {
      lien.addEventListener("click", function (e) {
        var id = lien.getAttribute("data-aller");
        var index = panneaux.findIndex(function (p) { return p.id === id; });
        if (index > -1) {
          e.preventDefault();
          choisir(index, true, true);
          onglets[index].scrollIntoView({ block: "nearest" });
        }
      });
    });

    function depuisAdresse() {
      var id = window.location.hash.replace("#", "");
      var index = panneaux.findIndex(function (p) { return p.id === id; });
      choisir(index > -1 ? index : 0, false, false);
    }
    window.addEventListener("hashchange", depuisAdresse);
    depuisAdresse();
  });

  /* ---------- Frise d'une journée ---------- */
  var frise = document.querySelector("[data-frise]");
  if (frise) {
    var boutons = Array.prototype.slice.call(frise.querySelectorAll(".frise__btn"));
    var textes = Array.prototype.slice.call(document.querySelectorAll(".frise__etape-texte"));
    var curseur = document.getElementById("curseur-heure");
    var precedent = document.getElementById("frise-precedent");
    var suivant = document.getElementById("frise-suivant");
    var position = document.getElementById("frise-position");
    var actuel = 0;

    function afficher(index) {
      actuel = index;
      boutons.forEach(function (b, i) { b.setAttribute("aria-pressed", i === index ? "true" : "false"); });
      textes.forEach(function (t, i) { t.hidden = i !== index; });
      if (curseur) {
        curseur.value = String(index);
        curseur.setAttribute("aria-valuetext", boutons[index].querySelector(".heure").textContent);
      }
      if (precedent) precedent.disabled = index === 0;
      if (suivant) suivant.disabled = index === boutons.length - 1;
      if (position) position.textContent = "Étape " + (index + 1) + " sur " + boutons.length;
    }

    boutons.forEach(function (b, i) { b.addEventListener("click", function () { afficher(i); }); });
    if (curseur) curseur.addEventListener("input", function () { afficher(parseInt(curseur.value, 10)); });
    if (precedent) precedent.addEventListener("click", function () { if (actuel > 0) afficher(actuel - 1); });
    if (suivant) suivant.addEventListener("click", function () { if (actuel < boutons.length - 1) afficher(actuel + 1); });
    afficher(0);
  }

  /* ---------- Étapes dépliables (parcours) ---------- */
  var etapes = Array.prototype.slice.call(document.querySelectorAll(".etape__bouton"));
  function regler(bouton, ouvrir) {
    var detail = document.getElementById(bouton.getAttribute("aria-controls"));
    bouton.setAttribute("aria-expanded", ouvrir ? "true" : "false");
    var indic = bouton.querySelector(".indic");
    if (indic) indic.textContent = ouvrir ? "Masquer" : "Détails";
    if (detail) detail.hidden = !ouvrir;
  }
  etapes.forEach(function (b) {
    regler(b, false);
    b.addEventListener("click", function () {
      regler(b, b.getAttribute("aria-expanded") !== "true");
    });
  });
  var toutOuvrir = document.getElementById("tout-ouvrir");
  if (toutOuvrir) {
    toutOuvrir.hidden = false;
    toutOuvrir.addEventListener("click", function () {
      var ouvrir = toutOuvrir.getAttribute("aria-pressed") !== "true";
      etapes.forEach(function (b) { regler(b, ouvrir); });
      toutOuvrir.setAttribute("aria-pressed", ouvrir ? "true" : "false");
      toutOuvrir.textContent = ouvrir ? "Tout replier" : "Tout déplier";
    });
  }

  /* ---------- Filtres du débat ---------- */
  var listeArguments = document.querySelector("[data-arguments]");
  if (listeArguments) {
    var cartes = Array.prototype.slice.call(listeArguments.querySelectorAll(".argument"));
    var compte = document.getElementById("compte-arguments");
    var filtre = { camp: "tous", theme: "tous" };

    function appliquer() {
      var visibles = 0;
      cartes.forEach(function (c) {
        var okCamp = filtre.camp === "tous" || c.getAttribute("data-camp") === filtre.camp;
        var okTheme = filtre.theme === "tous" || (" " + c.getAttribute("data-themes") + " ").indexOf(" " + filtre.theme + " ") > -1;
        c.hidden = !(okCamp && okTheme);
        if (!c.hidden) visibles++;
      });
      if (compte) {
        compte.textContent = visibles === 0
          ? "Aucun argument ne correspond à ces deux filtres."
          : visibles + (visibles > 1 ? " arguments affichés" : " argument affiché") + " sur " + cartes.length + ".";
      }
    }

    document.querySelectorAll("[data-filtre]").forEach(function (b) {
      b.addEventListener("click", function () {
        var type = b.getAttribute("data-filtre");
        filtre[type] = b.getAttribute("data-valeur");
        document.querySelectorAll('[data-filtre="' + type + '"]').forEach(function (autre) {
          autre.setAttribute("aria-pressed", autre === b ? "true" : "false");
        });
        appliquer();
      });
    });
    appliquer();
  }

  /* ---------- Glossaire ---------- */
  var glossaire = document.querySelector("[data-glossaire]");
  if (glossaire) {
    var termes = Array.prototype.slice.call(glossaire.querySelectorAll(".terme"));
    var champ = document.getElementById("recherche-glossaire");
    var zoneLettres = document.getElementById("lettres");
    var message = document.getElementById("message-glossaire");
    var lettreActive = "";

    function premiereLettre(t) {
      return normaliser(t.querySelector("dt").textContent.trim()).charAt(0).toUpperCase();
    }

    function filtrer() {
      var q = normaliser(champ.value.trim());
      var n = 0;
      termes.forEach(function (t) {
        var okTexte = q === "" || normaliser(t.textContent).indexOf(q) > -1;
        var okLettre = lettreActive === "" || premiereLettre(t) === lettreActive;
        t.hidden = !(okTexte && okLettre);
        if (!t.hidden) n++;
      });
      message.textContent = n === 0
        ? "Aucune notion trouvée. Essayez un autre mot ou cliquez sur « Toutes »."
        : n + (n > 1 ? " notions affichées." : " notion affichée.");
    }

    if (zoneLettres) {
      var presentes = {};
      termes.forEach(function (t) { presentes[premiereLettre(t)] = true; });
      var tout = document.createElement("button");
      tout.type = "button";
      tout.textContent = "Toutes";
      tout.setAttribute("aria-pressed", "true");
      zoneLettres.appendChild(tout);
      var boutonsLettres = [tout];
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (l) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = l;
        b.setAttribute("aria-pressed", "false");
        if (!presentes[l]) { b.disabled = true; b.setAttribute("aria-label", l + " (aucune notion)"); }
        zoneLettres.appendChild(b);
        boutonsLettres.push(b);
      });
      boutonsLettres.forEach(function (b) {
        b.addEventListener("click", function () {
          lettreActive = b === tout ? "" : b.textContent;
          boutonsLettres.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          filtrer();
        });
      });
      zoneLettres.hidden = false;
    }
    champ.addEventListener("input", filtrer);
    filtrer();
  }

  /* ---------- Quiz ---------- */
  var quiz = document.getElementById("quiz");
  if (quiz) {
    var questions = Array.prototype.slice.call(quiz.querySelectorAll(".question"));
    var bilan = document.getElementById("bilan-quiz");
    var recommencer = document.getElementById("recommencer");

    quiz.addEventListener("submit", function (e) {
      e.preventDefault();
      var justes = 0;
      var sansReponse = 0;
      questions.forEach(function (q) {
        var bonne = q.getAttribute("data-bonne");
        var coche = q.querySelector("input:checked");
        var correction = q.querySelector(".correction");
        var verdict = correction.querySelector(".verdict");
        q.querySelectorAll("label").forEach(function (l) { l.classList.remove("est-juste", "est-faux"); });
        var labelBonne = q.querySelector('input[value="' + bonne + '"]').closest("label");
        labelBonne.classList.add("est-juste");
        if (!coche) {
          sansReponse++;
          verdict.textContent = "Pas de réponse. ";
          correction.classList.add("faux");
        } else if (coche.value === bonne) {
          justes++;
          verdict.textContent = "Bonne réponse. ";
          correction.classList.remove("faux");
        } else {
          coche.closest("label").classList.add("est-faux");
          verdict.textContent = "Ce n'est pas la bonne réponse. ";
          correction.classList.add("faux");
        }
        correction.hidden = false;
      });
      var phrase = "Vous avez " + justes + " bonne" + (justes > 1 ? "s" : "") + " réponse" + (justes > 1 ? "s" : "") + " sur " + questions.length + ".";
      if (sansReponse > 0) phrase += " " + sansReponse + " question" + (sansReponse > 1 ? "s" : "") + " sans réponse.";
      bilan.textContent = phrase + " Lisez les corrections sous chaque question.";
      bilan.hidden = false;
      recommencer.hidden = false;
      bilan.focus();
    });

    recommencer.addEventListener("click", function () {
      quiz.reset();
      questions.forEach(function (q) {
        q.querySelector(".correction").hidden = true;
        q.querySelectorAll("label").forEach(function (l) { l.classList.remove("est-juste", "est-faux"); });
      });
      bilan.hidden = true;
      recommencer.hidden = true;
      questions[0].querySelector("input").focus();
    });

    questions.forEach(function (q) { q.querySelector(".correction").hidden = true; });
  }
})();
