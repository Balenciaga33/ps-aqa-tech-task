import { BasePage } from './base.page';
import { DeleteNoteModal, UpdateNoteModal } from './components/note-modals';

export class NotesPage extends BasePage {
  readonly updateModal = new UpdateNoteModal(this.page);
  readonly deleteModal = new DeleteNoteModal(this.page);

  async createNote(title: string, content: string) {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/notes') && response.request().method() === 'POST',
    );
    await this.page.locator('#note-title').fill(title);
    await this.page.locator('#note-content').fill(content);
    await this.page.locator('#create-note-form button[type="submit"]').click();
    return responsePromise;
  }

  noteItem(title: string) {
    return this.page.locator('.note-item', { hasText: title });
  }

  async editNote(currentTitle: string, nextTitle: string, nextContent: string) {
    await this.noteItem(currentTitle).locator('[data-action="edit"]').click();
    return this.updateModal.save(nextTitle, nextContent);
  }

  async deleteNote(title: string) {
    await this.noteItem(title).locator('[data-action="delete"]').click();
    return this.deleteModal.confirm();
  }

  async cancelDeleteNote(title: string) {
    await this.noteItem(title).locator('[data-action="delete"]').click();
    await this.deleteModal.cancel();
  }

  async cancelEditNote(title: string) {
    await this.noteItem(title).locator('[data-action="edit"]').click();
    await this.updateModal.cancel();
  }

  async searchNotes(query: string) {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-search-query').fill(query);
    return responsePromise;
  }

  emptyListMessage() {
    return this.page.getByText('No notes found.');
  }

  async setPageSize(size: string) {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-page-size').selectOption(size);
    return responsePromise;
  }

  async setSort(value: string) {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-search-sort').selectOption(value);
    return responsePromise;
  }

  async nextPage() {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-next-page').click();
    return responsePromise;
  }

  listTotal() {
    return this.page.locator('#notes-list-total');
  }

  pageInfo() {
    return this.page.locator('#notes-page-info');
  }

  nextPageButton() {
    return this.page.locator('#notes-next-page');
  }

  notesView() {
    return this.page.locator('#notes-view');
  }

  noteTitles() {
    return this.page.locator('.note-item h3');
  }
}
