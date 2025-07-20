import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

import {
  ErrorStatus,
  type IError,
  type ISuccess,
  SuccessStatus,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createError(error: IError) {
  switch (error.status) {
    case ErrorStatus.BAD_REQUEST:
      return { status: error.status, message: "Bad Request" };
    case ErrorStatus.NOT_AUTHENTICATED:
      return { status: error.status, message: "Unauthorized" };
    case ErrorStatus.NOT_AUTHORIZED:
      return { status: error.status, message: "Forbidden" };
    case ErrorStatus.NOT_FOUND:
      return { status: error.status, message: "Not Found" };
    case ErrorStatus.DUPLICATE_ENTITY:
      return { status: error.status, message: "Conflict" };
    case ErrorStatus.SERVER_ERROR:
      return { status: error.status, message: "Internal Server Error" };
    default:
      return { status: error.status, message: "Unknown Error" };
  }
}

export function createSuccess(success: ISuccess) {
  switch (success.status) {
    case SuccessStatus.CREATED:
      return { status: success.status, message: "Created" };
    case SuccessStatus.UPDATED:
      return { status: success.status, message: "Updated" };
    case SuccessStatus.ACCEPTED:
      return { status: success.status, message: "Accepted" };
    default:
      return { status: success.status, message: "Success" };
  }
}

export function dispatchError(error: IError) {
  return window.dispatchEvent(
    new CustomEvent("axios-error", { detail: createError(error) })
  );
}

// Country name to flag emoji mapping
const countryFlags: Record<string, string> = {
  // Common countries
  "United States": "🇺🇸",
  "Canada": "🇨🇦", 
  "United Kingdom": "🇬🇧",
  "Germany": "🇩🇪",
  "France": "🇫🇷",
  "Italy": "🇮🇹",
  "Spain": "🇪🇸",
  "Netherlands": "🇳🇱",
  "Belgium": "🇧🇪",
  "Switzerland": "🇨🇭",
  "Austria": "🇦🇹",
  "Sweden": "🇸🇪",
  "Norway": "🇳🇴",
  "Denmark": "🇩🇰",
  "Finland": "🇫🇮",
  "Poland": "🇵🇱",
  "Czech Republic": "🇨🇿",
  "Hungary": "🇭🇺",
  "Portugal": "🇵🇹",
  "Greece": "🇬🇷",
  "Turkey": "🇹🇷",
  "Russia": "🇷🇺",
  "China": "🇨🇳",
  "Japan": "🇯🇵",
  "South Korea": "🇰🇷",
  "India": "🇮🇳",
  "Australia": "🇦🇺",
  "New Zealand": "🇳🇿",
  "Brazil": "🇧🇷",
  "Argentina": "🇦🇷",
  "Mexico": "🇲🇽",
  "South Africa": "🇿🇦",
  "Egypt": "🇪🇬",
  "Israel": "🇮🇱",
  "United Arab Emirates": "🇦🇪",
  "Saudi Arabia": "🇸🇦",
  "Singapore": "🇸🇬",
  "Malaysia": "🇲🇾",
  "Thailand": "🇹🇭",
  "Indonesia": "🇮🇩",
  "Philippines": "🇵🇭",
  "Vietnam": "🇻🇳",
  "Ireland": "🇮🇪",
  "Luxembourg": "🇱🇺",
  "Iceland": "🇮🇸",
  "Croatia": "🇭🇷",
  "Slovenia": "🇸🇮",
  "Slovakia": "🇸🇰",
  "Estonia": "🇪🇪",
  "Latvia": "🇱🇻",
  "Lithuania": "🇱🇹",
  "Romania": "🇷🇴",
  "Bulgaria": "🇧🇬",
  "Serbia": "🇷🇸",
  "Montenegro": "🇲🇪",
  "Bosnia and Herzegovina": "🇧🇦",
  "North Macedonia": "🇲🇰",
  "Albania": "🇦🇱",
  "Moldova": "🇲🇩",
  "Ukraine": "🇺🇦",
  "Belarus": "🇧🇾",
  "Georgia": "🇬🇪",
  "Armenia": "🇦🇲",
  "Azerbaijan": "🇦🇿",
  "Kazakhstan": "🇰🇿",
  "Uzbekistan": "🇺🇿",
  "Kyrgyzstan": "🇰🇬",
  "Tajikistan": "🇹🇯",
  "Turkmenistan": "🇹🇲",
  "Mongolia": "🇲🇳",
  "North Korea": "🇰🇵",
  "Taiwan": "🇹🇼",
  "Hong Kong": "🇭🇰",
  "Macau": "🇲🇴",
  "Myanmar": "🇲🇲",
  "Cambodia": "🇰🇭",
  "Laos": "🇱🇦",
  "Bangladesh": "🇧🇩",
  "Pakistan": "🇵🇰",
  "Afghanistan": "🇦🇫",
  "Iran": "🇮🇷",
  "Iraq": "🇮🇶",
  "Syria": "🇸🇾",
  "Lebanon": "🇱🇧",
  "Jordan": "🇯🇴",
  "Kuwait": "🇰🇼",
  "Bahrain": "🇧🇭",
  "Qatar": "🇶🇦",
  "Oman": "🇴🇲",
  "Yemen": "🇾🇪",
};

export function getCountryFlag(countryName: string): string {
  return countryFlags[countryName] || "🏳️";
}

export function dispatchSuccess(success: ISuccess) {
  return window.dispatchEvent(
    new CustomEvent("axios-success", { detail: createSuccess(success) })
  );
}
