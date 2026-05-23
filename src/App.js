
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";
// mappa
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// QR
import { Html5QrcodeScanner } from "html5-qrcode";

export default function App() {
  const [nome, setNome] = useState("");

const [logged, setLogged] = useState(false);
const [utente, setUtente] = useState("");

  const [azienda, setAzienda] = useState("");
  const [presenze, setPresenze] = useState([]);
  const [cantieri, setCantieri] = useState([]);
  const [cantiereSelezionato, setCantiereSelezionato] = useState("");
  const scannerRef = useRef(null);

const calcolaDurata = (p) => {
  if (!p.uscita || !p.ingresso) return "";

  const ingresso = new Date(p.ingresso);
  const uscita = new Date(p.uscita);

  const diff = uscita - ingresso;

  const minuti = Math.floor(diff / 60000);
  const ore = Math.floor(minuti / 60);
  const resto = minuti % 60;

  return `${ore}h ${resto}min`;
};

  // ✅ carica presenze
  const caricaPresenze = async () => {
    const { data } = await supabase
      .from("accessi")
      .select("*")
      .order("ingresso", { ascending: false });

    if (data) setPresenze(data);
  };

  // ✅ carica cantieri
  const caricaCantieri = async () => {
    const { data } = await supabase.from("cantieri").select("*");
    if (data) setCantieri(data);
  };

  useEffect(() => {
    caricaPresenze();
    caricaCantieri();

    // ✅ attiva scanner QR
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: 250 },
        false
      );

     
scanner.render((decodedText) => {
  if (!logged) {
    if (decodedText.includes("ID")) {
      alert("Login effettuato ✅");

      setUtente(decodedText);
      setLogged(true);

      // ✅ IMPORTANTISSIMO → FERMA SCANNER
      scanner.clear();
      return;
    } else {
      alert("QR non valido ❌");
      return;
    }
  }

  // ✅ normale uso dopo login
  setNome(decodedText);
});


      scannerRef.current = scanner;
    }
 }, [logged]);

  // ✅ ENTRATA / USCITA AUTOMATICA
  const registraIngresso = async () => {
    if (!nome || !cantiereSelezionato) {
      alert("Inserisci nome e seleziona cantiere");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (posizione) => {
      const lat = posizione.coords.latitude;
      const lng = posizione.coords.longitude;

t latCantiere = 44.3538;
const lngCantiere = 9.2152;

// distanza approssimata in metri
const distanza = Math.sqrt(
  Math.pow(lat - latCantiere, 2) +
  Math.pow(lng - lngCantiere, 2)
) * 111000;

if (distanza > 50) {
  alert("Sei fuori dal cantiere ❌");
  return;
}

      // 🔍 controlla se è già dentro
      const { data: accessiAperti } = await supabase
        .from("accessi")
        .select("*")
        .eq("nome", nome)
        .is("uscita", null);

      if (accessiAperti && accessiAperti.length > 0) {
        // ✅ USCITA
        await supabase
          .from("accessi")
          .update({ uscita: new Date() })
          .eq("id", accessiAperti[0].id);

        alert("Uscita registrata ✅");
      } else {
        // ✅ INGRESSO
        await supabase.from("accessi").insert([
          {
            nome,
            azienda,
            ingresso: new Date(),
            cantiere_id: cantiereSelezionato,
            latitudine: lat,
            longitudine: lng,
          },
        ]);

        alert("Ingresso registrato ✅");
      }

      caricaPresenze();
      setNome("");
      setAzienda("");
    });
  };

const generaPDF = () => {
  const doc = new jsPDF();

  doc.text("Registro Presenze Cantiere", 10, 10);

  presenze.forEach((p, i) => {
    doc.text(
      `${p.nome} - ${p.azienda}`,
      10,
      20 + i * 10
    );
  });

  doc.save("presenze.pdf");
};

const calcolaDurata = (p) => {
  if (!p.uscita || !p.ingresso) return "";

  const ingresso = new Date(p.ingresso);
  const uscita = new Date(p.uscita);

  const diff = uscita - ingresso;

  const minuti = Math.floor(diff / 60000);
  const ore = Math.floor(minuti / 60);
  const resto = minuti % 60;

  return `${ore}h ${resto}min`;
};

if (!logged) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Scansiona QR Operatore 📲</h2>
      <div id="reader"></div>
    </div>
  );
}

  return (
    <div style={{ padding: 20 }}>
      <h1>🏗️ Accesso Cantiere</h1>
<p>👷 Utente: {utente}</p>
      <input
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        placeholder="Azienda"
        value={azienda}
        onChange={(e) => setAzienda(e.target.value)}
      />

      <br /><br />

      <select
        value={cantiereSelezionato}
        onChange={(e) => setCantiereSelezionato(e.target.value)}
      >
        <option value="">Seleziona cantiere</option>
        {cantieri.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome} - {c.cliente}
          </option>
        ))}
      </select>

      <br /><br />

      <button onClick={registraIngresso}>
        Registra ingresso
      </button>

<br /><br />
<button onClick={generaPDF}>
  Scarica PDF
</button>

      {/* ✅ SCANNER */}
      <h3>Scanner QR</h3>
      <div id="reader"></div>

      {/* ✅ LISTA */}
      <h2>Presenze</h2>
      <ul>
        {presenze.map((p) => (
          
<li key={p.id} style={{ marginBottom: "15px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
  {p.nome} ({p.azienda}) - {cantieri.find(c => String(c.id) === String(p.cantiere_id))?.nome || "Cantiere"}
  <br />
  🕒 Entrata: {p.ingresso ? new Date(p.ingresso).toLocaleString("it-IT") : ""}
  <br />
  🚪 Uscita: {p.uscita ? new Date(p.uscita).toLocaleString("it-IT") : "Ancora dentro"}

<br />
⏱️ Durata: {calcolaDurata(p)}

  <br />
  📍 {p.latitudine}, {p.longitudine}
</li>

        ))}
      </ul>

<h3>👷 Persone presenti: {presenze.filter((p) => !p.uscita).length}</h3>

<h3>👷 Dentro adesso:</h3>
<ul>
  {presenze
    .filter((p) => !p.uscita)
    .map((p) => (
      <li key={p.id}>
        {p.nome} ({p.azienda})
      </li>
    ))}
</ul>

      {/* ✅ MAPPA */}
      <h2>Mappa cantieri</h2>

      <MapContainer
        center={[45, 9]}
        zoom={6}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {presenze.map((p) =>
          p.latitudine ? (
            <Marker key={p.id} position={[p.latitudine, p.longitudine]}>
              <Popup>
                {p.nome} - {p.azienda}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}
