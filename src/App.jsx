import OutageSchedule from "./components/OutageSchedule";
import "./App.css";

function App() {
    return (
        <div className="app">
            <header className="app-header">
                <h1>⚡ Графік відключень на сьогодні</h1>
                <p className="app-subtitle">
                    {new Date().toLocaleDateString("uk-UA", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </header>
            <main>
                <OutageSchedule />
            </main>
            <footer className="app-footer">
                <p>
                    Дані мають інформаційний характер. Уточнюйте на офіційному
                    сайті обленерго.
                </p>
            </footer>
        </div>
    );
}

export default App;
