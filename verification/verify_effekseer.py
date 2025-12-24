
import time
from playwright.sync_api import sync_playwright

def verify_effekseer(page):
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    print("Loading game...")
    page.goto("http://localhost:8000/index.html")

    print("Waiting for game ready...")
    try:
        page.wait_for_function("window.Game && window.Game.ready", timeout=5000)
    except:
        print("Game ready timed out. Continuing to check Effekseer state.")

    # Check cache
    print("Checking Effekseer Cache...")
    cache_state = page.evaluate("""() => {
        const sys = Game.Systems.Effekseer;
        const keys = Object.keys(sys.cache);
        const states = {};
        for(let k of keys) {
            // We can't easily inspect Promise state in JS without await,
            // but we can try to play one.
            states[k] = "Present";
        }
        return states;
    }""")
    print(f"Cache keys: {cache_state}")

    # Try to play an effect
    print("Attempting to play 'Cure'...")
    play_result = page.evaluate("""async () => {
        try {
            const handle = await Game.Systems.Effekseer.play('Cure', {x:0, y:0, z:0});
            return handle ? 'Success' : 'Null Handle';
        } catch (e) {
            return 'Error: ' + e.message;
        }
    }""")
    print(f"Play result: {play_result}")

    assert play_result == 'Success', f"Failed to play effect. Result: {play_result}"

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_effekseer(page)
        except Exception as e:
            print(f"FAILED: {e}")
            raise e
        finally:
            browser.close()
