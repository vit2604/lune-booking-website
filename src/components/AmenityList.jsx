import {
  Bath,
  BedDouble,
  ChefHat,
  Headphones,
  Snowflake,
  Sparkles,
  Tv,
  WashingMachine,
  Waves,
  Wifi,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';

const iconMap = {
  'Free Wi-Fi': Wifi,
  'Air conditioning': Snowflake,
  'Private bathroom': Bath,
  'Smart TV': Tv,
  'Mini fridge': Sparkles,
  Kitchenette: ChefHat,
  Kitchen: ChefHat,
  Elevator: Sparkles,
  'Two beds': BedDouble,
  'Dining corner': Sparkles,
  'Washing machine': WashingMachine,
  'Near beach': Waves,
  '24/7 support': Headphones,
};

export default function AmenityList({ amenities = [], compact = false }) {
  const { t } = useTranslation();

  return (
    <ul className={compact ? 'flex flex-wrap gap-2' : 'grid gap-3 sm:grid-cols-2'}>
      {amenities.map((amenity) => {
        const Icon = iconMap[amenity] || Sparkles;
        return (
          <li
            key={amenity}
            className={
              compact
                ? 'inline-flex items-center gap-2 rounded-md bg-lune-cream px-3 py-2 text-xs font-medium text-lune-charcoal'
                : 'flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 text-sm font-medium text-lune-charcoal'
            }
          >
            <Icon className="h-4 w-4 text-lune-goldDark" aria-hidden="true" />
            <span>{t(`amenities.${amenity}`)}</span>
          </li>
        );
      })}
    </ul>
  );
}
