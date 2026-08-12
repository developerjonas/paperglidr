const COUNTRY_HEADER_KEY = "x-user-country"

export function setUserCountryHeader(
  headers: Headers,
  country: string | undefined
) {
  if (country == null) {
    headers.delete(COUNTRY_HEADER_KEY)
  } else {
    headers.set(COUNTRY_HEADER_KEY, country)
  }
}

// getUserCountry / getUserCoupon (PPP pricing) removed — PPP is cancelled,
// pppCoupons.ts deleted. setUserCountryHeader stays since middleware still
// needs to stamp the country header for whatever else reads it.
