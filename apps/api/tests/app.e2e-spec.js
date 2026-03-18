"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// AppModule is created in Plan 03
// import { AppModule } from '../src/app.module';
describe('API smoke test (e2e)', () => {
    let app;
    beforeAll(async () => {
        // Placeholder: will import AppModule after Plan 03 creates it.
        // For now, skip setup to allow the file to parse without errors.
    });
    afterAll(async () => {
        if (app)
            await app.close();
    });
    it('placeholder — wired to AppModule in Plan 03', () => {
        expect(true).toBe(true);
    });
});
