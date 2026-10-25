export const E2E_TIMEZONE_ID = 'Asia/Seoul'
export const E2E_LOCALE = 'ko-KR'

export function newSeoulContext(browser, options = {}) {
  return browser.newContext({
    ...options,
    timezoneId: E2E_TIMEZONE_ID,
    locale: E2E_LOCALE
  })
}
