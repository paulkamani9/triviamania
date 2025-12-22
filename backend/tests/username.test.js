import {
  generateUsername,
  validateUsername,
  validateRoomCode,
  validateCategory,
  validateDifficulty,
} from "../src/utils/username.js";

describe("Username Generator", () => {
  test("generates username in correct format", () => {
    const username = generateUsername();
    expect(username).toMatch(/^[A-Za-z]+ [A-Za-z]+ \d{1,4}$/);
  });

  test("generates different usernames", () => {
    const usernames = new Set();
    for (let i = 0; i < 100; i++) {
      usernames.add(generateUsername());
    }
    // Should have high uniqueness (at least 90 unique out of 100)
    expect(usernames.size).toBeGreaterThan(90);
  });
});

describe("Username Validation", () => {
  test("validates valid usernames", () => {
    expect(validateUsername("Player One").valid).toBe(true);
    expect(validateUsername("AB").valid).toBe(true);
    expect(validateUsername("A".repeat(30)).valid).toBe(true);
  });

  test("rejects invalid usernames", () => {
    expect(validateUsername("").valid).toBe(false);
    expect(validateUsername("A").valid).toBe(false);
    expect(validateUsername("A".repeat(31)).valid).toBe(false);
    expect(validateUsername(null).valid).toBe(false);
  });

  test("sanitizes HTML in usernames", () => {
    const result = validateUsername('Player<script>alert("x")</script>One');
    expect(result.valid).toBe(true);
    expect(result.username).toBe('Playeralert("x")One');
  });
});

describe("Room Code Validation", () => {
  test("validates valid room codes", () => {
    expect(validateRoomCode("ABC123")).toBe(true);
    expect(validateRoomCode("XXXXXX")).toBe(true);
    expect(validateRoomCode("123456")).toBe(true);
  });

  test("rejects invalid room codes", () => {
    expect(validateRoomCode("ABC12")).toBe(false); // Too short
    expect(validateRoomCode("ABC1234")).toBe(false); // Too long
    expect(validateRoomCode("")).toBe(false);
    expect(validateRoomCode(null)).toBe(false);
  });
});

describe("Category Validation", () => {
  test("validates valid categories", () => {
    expect(validateCategory(null)).toBe(true); // Any
    expect(validateCategory(9)).toBe(true);
    expect(validateCategory(32)).toBe(true);
    expect(validateCategory("15")).toBe(true);
  });

  test("rejects invalid categories", () => {
    expect(validateCategory(8)).toBe(false);
    expect(validateCategory(33)).toBe(false);
  });
});

describe("Difficulty Validation", () => {
  test("validates valid difficulties", () => {
    expect(validateDifficulty(null)).toBe(true);
    expect(validateDifficulty("easy")).toBe(true);
    expect(validateDifficulty("MEDIUM")).toBe(true);
    expect(validateDifficulty("Hard")).toBe(true);
  });

  test("rejects invalid difficulties", () => {
    expect(validateDifficulty("expert")).toBe(false);
    expect(validateDifficulty("impossible")).toBe(false);
  });
});
