# Genesis — World Evolution Simulator

You are the architect of a newborn planet. Life will emerge, adapt, compete, and evolve — but **you** decide its fate.

## How to Play

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. Click **Create New World** to generate a unique planet.
3. Each **epoch** represents ~500,000 years of natural evolution.
4. Before advancing, use your **decree** (one intervention per epoch) to shape the world.
5. Guide life toward **sapience**, maintain **biodiversity**, or experiment with catastrophe.

## Your Decisions

| Decree | Effect |
|--------|--------|
| ☀️ Warm the Climate | Raise global temperature |
| ❄️ Ice Age | Freeze the world, cull weak species |
| 💨 Oxygen Bloom | Surge O₂ for complex life |
| ☄️ Meteor Strike | Mass extinction + new niches |
| 🧪 Genetic Catalyst | Accelerate mutations |
| 🧠 Spark of Reason | Boost a species' intelligence |
| 🛡️ Sanctuary | Protect an endangered species |
| 🌊 Abundant Seas | Enrich ocean life |
| 🌋 Volcanic Fury | Erupt, reshape, destroy |
| ✨ Golden Age | Prosperity for all life |
| 💀 Great Filter | Cull 60% of species |
| 💧 Comet Delivery | Deliver water and organic compounds |

## Win & Lose Conditions

- **Victory**: A species reaches **85% intelligence** — sapience!
- **Defeat**: All life goes extinct.
- **Time's Up**: After 30 epochs, the simulation ends with a summary.

## Running Locally

No build step required. Just serve the folder:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080`.

## Project Structure

```
lifeos/
├── index.html          # Main app shell
├── css/style.css       # UI styling
└── js/
    ├── main.js         # Entry point
    ├── simulation.js   # Game loop & end conditions
    ├── world.js        # Planet generation & environment
    ├── life.js         # Species, evolution, fitness
    ├── decisions.js    # Player interventions
    ├── ui.js           # Rendering & interaction
    └── utils.js        # Helpers & constants
```

## Tips

- **Oxygen is key** — complex and intelligent life needs O₂. Use Oxygen Bloom early.
- **Don't rush sapience** — intelligence leaps require stable O₂ and time.
- **Meteor strikes** are devastating but open evolutionary niches for new species.
- **Watch the evolution tree** to track speciation lineages.
- **Sanctuary** endangered species to preserve genetic diversity.

---

*Built with vanilla JS. No dependencies.*
