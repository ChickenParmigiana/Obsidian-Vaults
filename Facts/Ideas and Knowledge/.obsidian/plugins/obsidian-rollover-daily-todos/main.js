'use strict';

var obsidian = require('obsidian');

class RolloverTodosPlugin extends obsidian.Plugin {
	checkDailyNotesEnabled() {
		return this.app.vault.config.pluginEnabledStatus['daily-notes'];
	}

	getDailyNotesDirectory() {
		if (this.dailyNotesDirectory != null) {
			return this.dailyNotesDirectory;
		}

		this.dailyNotesDirectory = this.app.internalPlugins.plugins['daily-notes'].instance.options.folder;
		return this.dailyNotesDirectory;
	}

	getLastDailyNote() {
		const dailyNotesDirectory = this.getDailyNotesDirectory();
		
		const files = this.app.vault.getAllLoadedFiles()
			.filter(file => file.path.startsWith(dailyNotesDirectory))
			.filter(file => file.basename != null)
			.sort((a, b) => new Date(b.basename).getTime() - new Date(a.basename).getTime());

		return files[1];
	}

	async getAllUnfinishedTodos(file) {
		const contents = await this.app.vault.read(file);
		const unfinishedTodosRegex = /\t*- \[ \].*/g;
		const unfinishedTodos = Array.from(contents.matchAll(unfinishedTodosRegex)).map(([todo]) => todo);
		return unfinishedTodos;
	}

	async onload() {
		this.settings = await this.loadData() || { templateHeading: 'none' };

		if (!this.checkDailyNotesEnabled()) {
			new obsidian.Notice('Daily notes plugin is not enabled. Enable it and then reload Obsidian.', 2000);
		}

		this.addSettingTab(new RollverTodosSettings(this.app, this));

		this.registerEvent(this.app.vault.on('create', async (file) => {
			// is a daily note
			const dailyNotesDirectory = this.getDailyNotesDirectory();
			if (!file.path.startsWith(dailyNotesDirectory)) return;

			// is today's daily note
			const today = new Date();
			if (today.toISOString().slice(0, 10) !== file.basename) return;

			// was just created
			if (today.getTime() - file.stat.ctime > 1) return;

			const lastDailyNote = this.getLastDailyNote();
			if (lastDailyNote == null) return;

			const unfinishedTodos = await this.getAllUnfinishedTodos(lastDailyNote);
			
			let dailyNoteContent = await this.app.vault.read(file);

			if (this.settings.templateHeading !== 'none') {
				const heading = this.settings.templateHeading + '\n';
				dailyNoteContent = dailyNoteContent.replace(heading, heading + unfinishedTodos.join('\n') + '\n');
			} else {
				dailyNoteContent += unfinishedTodos.join('\n');
			}

			await this.app.vault.modify(file, dailyNoteContent);
		}));
	}
}

class RollverTodosSettings extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	async getTemplateHeadings() {
		const template = this.app.internalPlugins.plugins['daily-notes'].instance.options.template;
		if (!template) return [];
		
		const file = this.app.vault.getAbstractFileByPath(template + '.md');
		const templateContents = await this.app.vault.read(file);
		const allHeadings = Array.from(templateContents.matchAll(/#{1,} .*/g)).map(([heading]) => heading);
		return allHeadings;
	}

	async display() {
		const templateHeadings = await this.getTemplateHeadings();

		this.containerEl.empty();
		new obsidian.Setting(this.containerEl)
			.setName('Template heading')
			.setDesc('Which heading from your template should the todos go under')
			.addDropdown((dropdown) => dropdown
				.addOptions({
					...templateHeadings.reduce((acc, heading) => {
						acc[heading] = heading;
						return acc;
					}, {}),
					'none': 'None' 
				})
				.setValue(this.plugin?.settings.templateHeading)
				.onChange(value => {
					this.plugin.settings.templateHeading = value;
					this.plugin.saveData(this.plugin.settings);
				})
			);
		}
}

module.exports = RolloverTodosPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW4sIFNldHRpbmcsIFBsdWdpblNldHRpbmdUYWIgfSBmcm9tICdvYnNpZGlhbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSb2xsb3ZlclRvZG9zUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcclxuXHRjaGVja0RhaWx5Tm90ZXNFbmFibGVkKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuYXBwLnZhdWx0LmNvbmZpZy5wbHVnaW5FbmFibGVkU3RhdHVzWydkYWlseS1ub3RlcyddO1xyXG5cdH1cclxuXHJcblx0Z2V0RGFpbHlOb3Rlc0RpcmVjdG9yeSgpIHtcclxuXHRcdGlmICh0aGlzLmRhaWx5Tm90ZXNEaXJlY3RvcnkgIT0gbnVsbCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5kYWlseU5vdGVzRGlyZWN0b3J5O1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuZGFpbHlOb3Rlc0RpcmVjdG9yeSA9IHRoaXMuYXBwLmludGVybmFsUGx1Z2lucy5wbHVnaW5zWydkYWlseS1ub3RlcyddLmluc3RhbmNlLm9wdGlvbnMuZm9sZGVyO1xyXG5cdFx0cmV0dXJuIHRoaXMuZGFpbHlOb3Rlc0RpcmVjdG9yeTtcclxuXHR9XHJcblxyXG5cdGdldExhc3REYWlseU5vdGUoKSB7XHJcblx0XHRjb25zdCBkYWlseU5vdGVzRGlyZWN0b3J5ID0gdGhpcy5nZXREYWlseU5vdGVzRGlyZWN0b3J5KCk7XHJcblx0XHRcclxuXHRcdGNvbnN0IGZpbGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0QWxsTG9hZGVkRmlsZXMoKVxyXG5cdFx0XHQuZmlsdGVyKGZpbGUgPT4gZmlsZS5wYXRoLnN0YXJ0c1dpdGgoZGFpbHlOb3Rlc0RpcmVjdG9yeSkpXHJcblx0XHRcdC5maWx0ZXIoZmlsZSA9PiBmaWxlLmJhc2VuYW1lICE9IG51bGwpXHJcblx0XHRcdC5zb3J0KChhLCBiKSA9PiBuZXcgRGF0ZShiLmJhc2VuYW1lKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShhLmJhc2VuYW1lKS5nZXRUaW1lKCkpO1xyXG5cclxuXHRcdHJldHVybiBmaWxlc1sxXTtcclxuXHR9XHJcblxyXG5cdGFzeW5jIGdldEFsbFVuZmluaXNoZWRUb2RvcyhmaWxlKSB7XHJcblx0XHRjb25zdCBjb250ZW50cyA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XHJcblx0XHRjb25zdCB1bmZpbmlzaGVkVG9kb3NSZWdleCA9IC9cXHQqLSBcXFsgXFxdLiovZ1xyXG5cdFx0Y29uc3QgdW5maW5pc2hlZFRvZG9zID0gQXJyYXkuZnJvbShjb250ZW50cy5tYXRjaEFsbCh1bmZpbmlzaGVkVG9kb3NSZWdleCkpLm1hcCgoW3RvZG9dKSA9PiB0b2RvKVxyXG5cdFx0cmV0dXJuIHVuZmluaXNoZWRUb2RvcztcclxuXHR9XHJcblxyXG5cdGFzeW5jIG9ubG9hZCgpIHtcclxuXHRcdHRoaXMuc2V0dGluZ3MgPSBhd2FpdCB0aGlzLmxvYWREYXRhKCkgfHwgeyB0ZW1wbGF0ZUhlYWRpbmc6ICdub25lJyB9O1xyXG5cclxuXHRcdGlmICghdGhpcy5jaGVja0RhaWx5Tm90ZXNFbmFibGVkKCkpIHtcclxuXHRcdFx0bmV3IE5vdGljZSgnRGFpbHkgbm90ZXMgcGx1Z2luIGlzIG5vdCBlbmFibGVkLiBFbmFibGUgaXQgYW5kIHRoZW4gcmVsb2FkIE9ic2lkaWFuLicsIDIwMDApXHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBSb2xsdmVyVG9kb3NTZXR0aW5ncyh0aGlzLmFwcCwgdGhpcykpXHJcblxyXG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKCdjcmVhdGUnLCBhc3luYyAoZmlsZSkgPT4ge1xyXG5cdFx0XHQvLyBpcyBhIGRhaWx5IG5vdGVcclxuXHRcdFx0Y29uc3QgZGFpbHlOb3Rlc0RpcmVjdG9yeSA9IHRoaXMuZ2V0RGFpbHlOb3Rlc0RpcmVjdG9yeSgpXHJcblx0XHRcdGlmICghZmlsZS5wYXRoLnN0YXJ0c1dpdGgoZGFpbHlOb3Rlc0RpcmVjdG9yeSkpIHJldHVybjtcclxuXHJcblx0XHRcdC8vIGlzIHRvZGF5J3MgZGFpbHkgbm90ZVxyXG5cdFx0XHRjb25zdCB0b2RheSA9IG5ldyBEYXRlKCk7XHJcblx0XHRcdGlmICh0b2RheS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKSAhPT0gZmlsZS5iYXNlbmFtZSkgcmV0dXJuO1xyXG5cclxuXHRcdFx0Ly8gd2FzIGp1c3QgY3JlYXRlZFxyXG5cdFx0XHRpZiAodG9kYXkuZ2V0VGltZSgpIC0gZmlsZS5zdGF0LmN0aW1lID4gMSkgcmV0dXJuO1xyXG5cclxuXHRcdFx0Y29uc3QgbGFzdERhaWx5Tm90ZSA9IHRoaXMuZ2V0TGFzdERhaWx5Tm90ZSgpO1xyXG5cdFx0XHRpZiAobGFzdERhaWx5Tm90ZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG5cdFx0XHRjb25zdCB1bmZpbmlzaGVkVG9kb3MgPSBhd2FpdCB0aGlzLmdldEFsbFVuZmluaXNoZWRUb2RvcyhsYXN0RGFpbHlOb3RlKVxyXG5cdFx0XHRcclxuXHRcdFx0bGV0IGRhaWx5Tm90ZUNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpXHJcblxyXG5cdFx0XHRpZiAodGhpcy5zZXR0aW5ncy50ZW1wbGF0ZUhlYWRpbmcgIT09ICdub25lJykge1xyXG5cdFx0XHRcdGNvbnN0IGhlYWRpbmcgPSB0aGlzLnNldHRpbmdzLnRlbXBsYXRlSGVhZGluZyArICdcXG4nXHJcblx0XHRcdFx0ZGFpbHlOb3RlQ29udGVudCA9IGRhaWx5Tm90ZUNvbnRlbnQucmVwbGFjZShoZWFkaW5nLCBoZWFkaW5nICsgdW5maW5pc2hlZFRvZG9zLmpvaW4oJ1xcbicpICsgJ1xcbicpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0ZGFpbHlOb3RlQ29udGVudCArPSB1bmZpbmlzaGVkVG9kb3Muam9pbignXFxuJylcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGRhaWx5Tm90ZUNvbnRlbnQpO1xyXG5cdFx0fSkpXHJcblx0fVxyXG59XHJcblxyXG5jbGFzcyBSb2xsdmVyVG9kb3NTZXR0aW5ncyBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xyXG5cdGNvbnN0cnVjdG9yKGFwcCwgcGx1Z2luKSB7XHJcblx0XHRzdXBlcihhcHAsIHBsdWdpbilcclxuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luXHJcblx0fVxyXG5cclxuXHRhc3luYyBnZXRUZW1wbGF0ZUhlYWRpbmdzKCkge1xyXG5cdFx0Y29uc3QgdGVtcGxhdGUgPSB0aGlzLmFwcC5pbnRlcm5hbFBsdWdpbnMucGx1Z2luc1snZGFpbHktbm90ZXMnXS5pbnN0YW5jZS5vcHRpb25zLnRlbXBsYXRlO1xyXG5cdFx0aWYgKCF0ZW1wbGF0ZSkgcmV0dXJuIFtdO1xyXG5cdFx0XHJcblx0XHRjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRlbXBsYXRlICsgJy5tZCcpXHJcblx0XHRjb25zdCB0ZW1wbGF0ZUNvbnRlbnRzID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZChmaWxlKVxyXG5cdFx0Y29uc3QgYWxsSGVhZGluZ3MgPSBBcnJheS5mcm9tKHRlbXBsYXRlQ29udGVudHMubWF0Y2hBbGwoLyN7MSx9IC4qL2cpKS5tYXAoKFtoZWFkaW5nXSkgPT4gaGVhZGluZylcclxuXHRcdHJldHVybiBhbGxIZWFkaW5ncztcclxuXHR9XHJcblxyXG5cdGFzeW5jIGRpc3BsYXkoKSB7XHJcblx0XHRjb25zdCB0ZW1wbGF0ZUhlYWRpbmdzID0gYXdhaXQgdGhpcy5nZXRUZW1wbGF0ZUhlYWRpbmdzKClcclxuXHJcblx0XHR0aGlzLmNvbnRhaW5lckVsLmVtcHR5KClcclxuXHRcdG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcblx0XHRcdC5zZXROYW1lKCdUZW1wbGF0ZSBoZWFkaW5nJylcclxuXHRcdFx0LnNldERlc2MoJ1doaWNoIGhlYWRpbmcgZnJvbSB5b3VyIHRlbXBsYXRlIHNob3VsZCB0aGUgdG9kb3MgZ28gdW5kZXInKVxyXG5cdFx0XHQuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiBkcm9wZG93blxyXG5cdFx0XHRcdC5hZGRPcHRpb25zKHtcclxuXHRcdFx0XHRcdC4uLnRlbXBsYXRlSGVhZGluZ3MucmVkdWNlKChhY2MsIGhlYWRpbmcpID0+IHtcclxuXHRcdFx0XHRcdFx0YWNjW2hlYWRpbmddID0gaGVhZGluZztcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGFjYztcclxuXHRcdFx0XHRcdH0sIHt9KSxcclxuXHRcdFx0XHRcdCdub25lJzogJ05vbmUnIFxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luPy5zZXR0aW5ncy50ZW1wbGF0ZUhlYWRpbmcpXHJcblx0XHRcdFx0Lm9uQ2hhbmdlKHZhbHVlID0+IHtcclxuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlSGVhZGluZyA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2F2ZURhdGEodGhpcy5wbHVnaW4uc2V0dGluZ3MpXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0KVxyXG5cdFx0fVxyXG59XHJcbiJdLCJuYW1lcyI6WyJQbHVnaW4iLCJOb3RpY2UiLCJQbHVnaW5TZXR0aW5nVGFiIiwiU2V0dGluZyJdLCJtYXBwaW5ncyI6Ijs7OztBQUVlLE1BQU0sbUJBQW1CLFNBQVNBLGVBQU0sQ0FBQztBQUN4RCxDQUFDLHNCQUFzQixHQUFHO0FBQzFCLEVBQUUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDbEUsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxzQkFBc0IsR0FBRztBQUMxQixFQUFFLElBQUksSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksRUFB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
