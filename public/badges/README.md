# Badge artwork

PNG or SVG assets for levels, mastery tiers, regions, and UI icons.

## Layout

```
public/badges/
  ui/           — compass, stars, locks
  levels/       — Explorer, Scout, Pathfinder, … (player rank badges)
  mastery/      — bronze, silver, gold tier medals
  regions/      — optional regional completion badges
  speed/        — timed-mode badges (future)
```

## Naming

Register every file in `src/data/badgeAssets.ts` with a stable `BadgeAssetId`.
Use lowercase kebab-case filenames matching the id suffix, e.g. `levels/pathfinder.svg`.

## Fallbacks

Until art is added, `BadgeArt` shows emoji/SVG placeholders defined in the registry.
