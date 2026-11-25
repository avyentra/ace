# Interactions added

Two new files are linked in `index.html` (after your own CSS and JS):

- `assets/css/interactions.css`
- `assets/js/interactions.js`

Your own `style.css` and `main.js` are not changed.

## Why it was needed
On desktop, the cards, arrows, the red "Monthly" pill and the button pills are part of the
background images (`bg-*.jpg`). So hovering did nothing, the space-card arrows were not
links, and clicking Quarterly/Yearly could not move the red pill.
`interactions.js` places animated layers exactly over those drawn parts. They use the same
1920px coordinates, so they scale with your stage.

## What works now
| Section | Animation | Working |
|---|---|---|
| Why ACE (hub) | Centre ripples + rotating ring, light sparks running along the lines, pulsing dots, and the logo heartbeat. On card hover: red glow, line lights up, icon pops | — |
| Our Spaces | Gold rotating border, mouse spotlight and shine on hover | Arrow buttons (and whole cards) go to Pricing and flash the matching plan |
| Our Locations | Light sweep on the slanted cards | "Explore Mohali/Zirakpur" turn white on hover and open Google Maps. "Book a Space Tour" bar has a shimmer and opens the booking form |
| Amenities | Red glow and spotlight on the 3 photo cards. The "Explore Our Amenities" bar glows and shimmers, and its arrow pings | Card arrows go to the matching plan / booking. The bar opens the booking form |
| Pricing | The red pill slides between Monthly / Quarterly / Yearly with a bounce. Cards light up on change. Hover glow on cards, quote buttons fill, arrows slide | Every "Request … Quote" and "Request a Custom Quote" opens the form with the plan and billing filled in |
| Book a Visit | Pulsing calendar tile, breathing glow on the button, arrow slide | "Schedule a Visit" opens the booking form |
| Footer CTA | A red light runs around the card border, a shine sweeps across "ideal workspace?", and "Book a Tour" has a shimmer and a glow | "Book a Tour" opens the booking form. "Request a Quote" fills gold on hover and opens the quote form |
| Footer links | Quick Links: row highlight, a second chevron slides in, and the text nudges right. Workspace Options and social icons: tile glow and shine. Contact icons: ring pulse. "Schedule a Visit" glows | Day Pass / Dedicated Desk / Private Cabin / Meeting Room go to Pricing and flash that plan. "Book a Visit" and "Schedule a Visit" open the form. Instagram and WhatsApp open the real pages |

The form sends the details to WhatsApp. The mobile layout uses the same form, billing state and plan links.

## Edit before going live
At the top of `assets/js/interactions.js`, set `CONFIG`: WhatsApp number, phone, the two Google Maps links, and the LinkedIn and Facebook URLs. Until those two are filled in, clicking them shows "coming soon".
