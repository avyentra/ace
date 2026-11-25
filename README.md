# ACE Spaces — Website

Static website built from the Figma design "ACE SPACES - final".
Open `index.html` in a browser. No build step is needed.

## Folder
```
acespaces-website/
├── index.html        all 9 sections (Hero → Footer)
├── css/style.css     layout, colours, glow effects, responsive
├── css/wow.css       premium motion layer
├── js/main.js        interactions (see CONFIG at the top)
├── js/wow.js         preloader, particles, cursor, reveals
└── images/           photos cropped from the Figma design
```

## Edit before going live
- `js/main.js` → `CONFIG`: WhatsApp number, phone, email, tour video (YouTube embed URL)
- `index.html`: phone/email in the footer and `tel:` links (currently the design's sample `+91 98765 43210` / `hello@acespaces.in`)
- Testimonials (Aman Verma, Neha Bansal, Rohit Mehra) and stats (3+ locations, 50+ events) come from the design mock-up. Replace them with real ones.
- `images/`: swap in the original high-resolution photos, keeping the same file names.

## Animations
Base layer (`css/style.css` + `js/main.js`): scroll reveal, count-up stats, 3D card tilt, carousel, FAQ accordion, plan tabs.

Wow layer (`css/wow.css` + `js/wow.js`):
- **Preloader:** the 3 logo triangles fly in, "ACE Spaces" types in letter by letter, a loading bar fills, then a red curtain wipes away to show the site
- **Hero heading:** "You Bring the Dream." reveals letter by letter in 3D with a blur, then a light shine keeps sweeping across the gold "the Dream."
- **Gold dust:** glowing gold and red particles float up in the hero and drift away from the cursor
- **Hero mouse effects:** a spotlight follows the mouse, the photo shifts slightly (parallax) and the glass card tilts in 3D
- **Custom cursor:** a red dot with a gold ring that grows over buttons and links
- **Magnetic buttons:** buttons and arrow circles pull towards the cursor
- **Click ripple:** a ripple spreads from the click point on buttons
- **Heading reveals:** every section heading rises up word by word from behind a mask
- **Photo reveals:** photos wipe in with a slow zoom-out as you scroll
- **Card spotlight:** a light glow follows the mouse over cards, plus a shine sweep on hover; the gold Spaces cards also get a rotating glowing border
- **Light sweeps:** a shimmer runs across the red bars and red buttons
- **Flowing light:** a light pulse travels along the gold wave lines
- **Hub diagram:** red light dots travel along the connecting lines, the six cards float, and the centre glows
- **Scroll progress:** a red-to-gold bar at the top of the page shows how far you have scrolled
- **Testimonials:** the featured card glows, and cards animate as they swap

The custom cursor, magnetic buttons, spotlight and hero mouse effects run only on desktop (mouse). If a visitor has "reduce motion" turned on, every animation is switched off.

## Forms
"Book a Tour", "Schedule a Visit" and the "Request … Quote" buttons open one form. It sends the details to WhatsApp.
