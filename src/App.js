import React, { useState, useEffect, useCallback, useRef } from 'react';
import "./styles.css";

const POKEAPI_URL = "https://pokeapi.co/api/v2";

function PokemonSearch() {
    const [pokemonList, setPokemonList] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const latestSearchId = useRef(0);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await fetch(`${POKEAPI_URL}/pokemon?limit=2000`);
                const data = await res.json();
                setPokemonList(data.results);
            } catch (error) {
                console.error("Error al cargar la lista inicial de Pokémon:", error);
            }
        };

        loadInitialData();
    }, []);

    const performSearch = useCallback(async (text) => {
        const cleanedText = text.toLowerCase().trim();
        
        if (cleanedText.length < 2) {
            setSearchResults([]);
            setIsLoading(false);
            return;
        }

        const currentSearchId = ++latestSearchId.current;

        setIsLoading(true);
        setSearchResults([]);

        let matches;
        const isNumeric = /^\d+$/.test(cleanedText);

        if (isNumeric) {
            matches = pokemonList.filter(p => {
                const id = p.url.split("/").slice(-2, -1)[0];
                return id === cleanedText; 
            });
        } else {
            matches = pokemonList.filter(p => p.name.includes(cleanedText));
        }

        const detailedResults = [];

        for (const p of matches) {
            if (currentSearchId !== latestSearchId.current) return;

            try {
                const res = await fetch(p.url);
                const info = await res.json();

                const spRes = await fetch(`${POKEAPI_URL}/pokemon-species/${info.id}`);
                const spData = await spRes.json();

                const nombreEsp = spData.names.find(n => n.language.name === "es")?.name || info.name;

                const descripcionEsp = spData.flavor_text_entries
                    .find(d => d.language.name === "es")
                    ?.flavor_text.replace(/\n|\f/g, " ") || "Sin descripción disponible.";

                const tipos = info.types.map(t => t.type.name).join(", ");

                detailedResults.push({
                    id: info.id,
                    name: nombreEsp,
                    image: info.sprites.other['official-artwork'].front_default,
                    types: tipos,
                    height: info.height / 10,
                    weight: info.weight / 10,
                    description: descripcionEsp,
                });

                if (currentSearchId === latestSearchId.current) {
                    setSearchResults([...detailedResults]);
                }

            } catch (error) {
                console.error(`Error al obtener detalles para ${p.name}:`, error);
            }
        }

        if (currentSearchId === latestSearchId.current) {
            setIsLoading(false);
        }
    }, [pokemonList]);

    useEffect(() => {
        if (pokemonList.length > 0) {
            performSearch(searchText);
        }
    }, [searchText, pokemonList, performSearch]);

    const handleInputChange = (e) => {
        setSearchText(e.target.value);
    };

    return (
        <div className="pokemon-search-container">
            <h1>Buscador Pokémon</h1>

            <input 
                type="text"
                id="buscar"
                placeholder="Escribe: char, pika o un ID (25, 150...)"
                value={searchText}
                onChange={handleInputChange}
            />
            
            {isLoading && <p>Cargando Pokémon...</p>}

            <div id="resultados">
                {searchResults.map(p => (
                    <div className="card" key={p.id}>
                        <img src={p.image} alt={`Artwork de ${p.name}`} />
                        <h2>{p.name}</h2>
                        <p><strong>ID:</strong> {p.id}</p>
                        <p><strong>Tipo:</strong> {p.types}</p>
                        <p><strong>Altura:</strong> {p.height} m</p>
                        <p><strong>Peso:</strong> {p.weight} kg</p>
                        <p className="descripcion">{p.description}</p>
                    </div>
                ))}

                {!isLoading && searchText.length >= 2 && searchResults.length === 0 && (
                    <p>No se encontraron resultados para "{searchText}"</p>
                )}
            </div>
        </div>
    );
}

export default PokemonSearch;
