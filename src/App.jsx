import { useEffect, useState } from "react";

function highlightText(text, query) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={index} style={{ backgroundColor: "red" }}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

function AdvicesList({ slip, query, onHandleAdd, selectedId, index }) {
  return (
    <li
      className="list"
      role="button"
      onClick={() => onHandleAdd(slip.id)}
      style={{
        backgroundColor: selectedId == slip.id ? "#429dff" : "",
        color: selectedId == slip.id ? "#ffFf" : "",
        userSelect: "none",
      }}
    >
      <p>
        {index}. {highlightText(slip.advice, query)}
      </p>
    </li>
  );
}

export default function App() {
  const [advices, setAdvices] = useState([]);
  // const [id] = advices.id;
  const [query, setQuery] = useState("never");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEqual, setIsEqual] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [favorite, setFavorite] = useState(function () {
    const stored = localStorage.getItem("advice");
    return JSON.parse(stored);
  });
  //Remove Advice rom favorite
  function handleDelete(id) {
    setFavorite((favorite) => favorite.filter((fav) => fav.id !== id));
  }
  function handleFavorite(item) {
    const newAdvice = { ...item, dateAdded: Date.now() };
    // Check if the advice already exists in the favorites
    const exists = favorite.some((fav) => fav.id === item.id);
    if (!exists) {
      setFavorite((favorite) => [...favorite, newAdvice]);
    }
  }

  function handleAdd(id) {
    setSelectedId((selectedId) => (selectedId == id ? null : id));
  }
  useEffect(() => {
    localStorage.setItem("advice", JSON.stringify(favorite));
  }, [favorite]);

 
  useEffect(() => {
    function setTitele() {
      // document.title = `Advice Collection\\${advices.id}`;
      console.log(advices)
      // console.log(id1)
    }
    setTitele();
  }, [advices]);
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const resp = await fetch(
          `https://api.adviceslip.com/advice/search/${query}`
        );
        if (!resp.ok) throw new Error("not found");
        const data = await resp.json();
        const limitedResults = data.slips ? data.slips.slice(0, 100) : [];
        const queryLowerCase = query.toLowerCase();

        const hasMatched = limitedResults.some((slip) =>
          slip.advice.toLowerCase().includes(queryLowerCase)
        );
        setIsEqual(hasMatched);
        setLoading(false);
        setAdvices(limitedResults);
      } catch (err) {
        setError(err.message || "An error occurred");
        setLoading(false);
      }
    }

    if (query.trim()) {
      fetchData();
    }
  }, [query]);

  return (
    <div className="container">
      <div className="search">
        <p>Advices found :{advices.length}</p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
      </div>
      <div className="advice-list">
        <ul>
          {!advices.length
            ? `No result found for '${query}'`
            : error
            ? error
            : loading
            ? "Loading..."
            : advices.map((advice, index) => (
                <AdvicesList
                  slip={advice}
                  key={advice.id}
                  isEqual={isEqual}
                  query={query}
                  onHandleAdd={handleAdd}
                  selectedId={selectedId}
                  index={index + 1}
                />
              ))}
        </ul>
      </div>
      <div className="stored-advice">
        <div className="details">
          <p className="favorite-text">
            {!selectedId ? "Favorite Advices 💖" : "Details"}
          </p>
          <p className="quantity">
            {!selectedId
              ? `Quantity: ${favorite.length}`
              : `Selected Advice's ID : ${selectedId}`}
          </p>
        </div>
        <div className="ordered-list">
          {selectedId ? (
            <AdviceDetails
              selectedId={selectedId}
              advices={advices}
              onHandleFavorite={handleFavorite}
              onClose={() => setSelectedId((selectedId) => !selectedId)}
            />
          ) : (
            <FavoriteAdvice favorite={favorite} onDelete={handleDelete} />
          )}
        </div>
      </div>
    </div>
  );
}

function AdviceDetails({ selectedId, onHandleFavorite, onClose }) {
  const [selectedAdvices, setSelectedAdvice] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    async function getAdvice() {
      if (!selectedId) return;
      setIsLoading(true);
      try {
        const resp = await fetch(
          `https://api.adviceslip.com/advice/${selectedId}`
        );
        if (!resp.ok)
          throw new Error(`Error fetching advice: ${resp.statusText}`);
        const data = await resp.json();
        setIsLoading(false);
        setSelectedAdvice(data.slip);
      } catch (err) {
        console.log(err);
        setIsLoading(false);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    getAdvice();
  }, [selectedId]);

  return (
    <li className="advice-details">
      <button className="close" onClick={onClose}>
        &larr;
      </button>

      <div className="info">
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <p className="selected">&quot;{selectedAdvices.advice}&quot;</p>
            <p className="advice-id">Advice ID:{selectedAdvices.id}</p>
          </>
        )}
        <button
          className="add-to-list"
          onClick={() => onHandleFavorite(selectedAdvices)}
        >
          Add to List
        </button>
      </div>
    </li>
  );
}

function FavoriteAdvice({ favorite, onDelete }) {
  return (
    <div className="favorite">
      <ul>
        {favorite.map((fav, index) => (
          <FavoriteList
            favorite={fav}
            key={fav.dateAdded}
            index={index}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

function FavoriteList({ favorite, index, onDelete }) {
  const date = favorite.dateAdded
    ? new Date(favorite.dateAdded).toLocaleString()
    : "not found";
  return (
    <li className="favorite-list">
      <div>
        {index + 1} . {favorite.advice}
      </div>
      <p>
        Date Added
        <br />
        {date}
      </p>

      <div>
        <button onClick={() => onDelete(favorite.id)}>X</button>
      </div>
    </li>
  );
}

function Loader() {
  return <p className="Loading">Loading...</p>;
}

function ErrorMessage({ err }) {
  return <span>{err}</span>;
}
