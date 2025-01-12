app = Vue.createApp({
    data() {
        return {
            character_position: { x: 400, y: 350 },
            display_mode: 'first',
            dialogs_json: null,
            order: null,
            c_dialog_body: null,
            d_dialog_body: null,
            e_dialog_body: null,
        };
    },
    methods: {
        character_position_style() {
            return { 'left': this.character_position.x + 'px', 'top': this.character_position.y + 'px' }
        },
        push_key(event) {
            if (this.starting_conversation()) {
                if (event.code == 'Space') {
                    this.update_dialog();
                }
            } else {
                this.update_character_position(event.code);
                this.check_collisions();
            }
        },
        update_character_position(code) {
            move_amount = 10;
            switch (code) {
                case 'ArrowUp':
                    this.character_position.y -= move_amount;
                    break;
                case 'ArrowRight':
                    this.character_position.x += move_amount;
                    break;
                case 'ArrowDown':
                    this.character_position.y += move_amount;
                    break;
                case 'ArrowLeft':
                    this.character_position.x -= move_amount;
                    break;
            }
            this.character_position.x = Math.max(0, Math.min(this.character_position.x, 1024 - 200));
            this.character_position.y = Math.max(0, Math.min(this.character_position.y, 768 - 50));
            localStorage.setItem('character_position_x', this.character_position.x);
            localStorage.setItem('character_position_y', this.character_position.y);
        },
        update_dialog() {
            switch (this.display_mode) {
                case 'staff_a':
                    dialogs_length = this.target_dialogs_length('A');
                    if (this.order < dialogs_length) {
                        this.order++;
                    } else {
                        this.set_first_state();
                    }
                    break;
                case 'staff_b':
                    dialogs_length = this.target_dialogs_length('B');
                    if (this.order < dialogs_length) {
                        this.order++;
                    } else {
                        this.set_first_state();
                    }
                    break;
                case 'staff_c':
                    if (this.c_dialog_body.includes('（Spaceキーでフィールドに戻る）')) {
                        this.set_first_state();
                    }
                case 'staff_d':
                    if (this.d_dialog_body.includes('（Spaceキーでフィールドに戻る）')) {
                        this.set_first_state();
                    }
                    break;
                case 'staff_e':
                    this.set_first_state();
                    break;
            }
        },
        set_first_state() {
            this.display_mode = 'first';
            this.character_position = { x: 400, y: 350 };
            localStorage.setItem('character_position_x', this.character_position.x);
            localStorage.setItem('character_position_y', this.character_position.y);
        },
        check_collisions() {
            staffs = ['staff_a', 'staff_b', 'staff_c', 'staff_d', 'staff_e'];
            for (staff_id of staffs) {
                staff = document.getElementById(staff_id);
                staff_position = staff.getBoundingClientRect();
                character_rect = character.getBoundingClientRect();
                if (
                    character_rect.left <= staff_position.right &&
                    character_rect.right >= staff_position.left &&
                    character_rect.top <= staff_position.bottom &&
                    character_rect.bottom >= staff_position.top
                ) {
                    this.display_mode = staff_id;
                    this.start_conversation();
                }
            }
        },
        starting_conversation() {
            return this.display_mode != 'first';
        },
        start_conversation() {
            this.order = 1;

            c_target_dialog = this.dialogs_json.find(item => item.staff == 'C');
            this.c_dialog_body = c_target_dialog.body;
            d_target_dialog = this.dialogs_json.find(item => item.staff == 'D');
            this.d_dialog_body = d_target_dialog.body;
            e_target_dialog = this.dialogs_json.find(item => item.staff == 'E');
            this.e_dialog_body = e_target_dialog.body;

            if (this.display_mode === 'staff_e') {
                this.destroy_survey();
            }
        },
        target_dialogs_length(staff) {
            target_dialogs = this.dialogs_json.filter(item => item.staff == staff)
            return target_dialogs.length;
        },
        a_dialog_body() {
            target_dialog = this.dialogs_json.find(item => item.staff == 'A' && item.order == this.order);
            a = this.dialogs_json.filter(item => item.staff == 'A');
            if (this.order < a.length) {
                return target_dialog.body + '（Spaceキーで次へ）';
            } else {
                return target_dialog.body + '（Spaceキーでフィールドに戻る）'
            }
        },
        b_dialog_body() {
            target_dialog = this.dialogs_json.find(item => item.staff == 'B' && item.order == this.order);
            if (this.order < this.target_dialogs_length('B')) {
                return target_dialog.body + '（Spaceキーで次へ）';
            } else {
                return target_dialog.body + '（Spaceキーでフィールドに戻る）'
            }
        },
        async answer_survey(star) {
            post_data = {
                star: star
            };
            url = 'https://api2024.m5a.jp/api/survey';
            response = await fetch(url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(post_data)
                }
            );
            if (response.status == 200) {
                survey = await response.json();
                localStorage.setItem('survey_id', survey.id);
                this.c_dialog_body = 'アンケートを投稿しました。（Spaceキーでフィールドに戻る）'
            } else {
                console.log('エラー発生');
            }
        },
        async edit_survey(star) {
            survey_id = localStorage.getItem('survey_id');
            if (survey_id == null) {
                console.log('エラー発生');
                return;
            }
            put_data = {
                star: star
            };
            url = 'https://api2024.m5a.jp/api/survey/' + survey_id;
            response = await fetch(url,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(put_data)
                }
            );
            if (response.status == 200) {
                this.d_dialog_body = 'アンケートを編集しました。（Spaceキーでフィールドに戻る）'
            } else {
                console.log('エラー発生');
            }
        },
        async destroy_survey() {
            survey_id = localStorage.getItem('survey_id');
            if (survey_id == null) {
                console.log('エラー発生');
                return;
            }
            url = 'https://api2024.m5a.jp/api/survey/' + survey_id;
            response = await fetch(url,
                {
                    method: 'DELETE'
                }
            );
            if (response.status == 200) {
                localStorage.removeItem('survey_id');
            } else {
                console.log('エラー発生');
            }
        }
    },
    async mounted() {
        window.addEventListener('keydown', this.push_key);
        url = 'https://api2024.m5a.jp/api/dialogs';
        response = await fetch(url);
        this.dialogs_json = await response.json();
        x = localStorage.getItem('character_position_x');
        if (x) {
            this.character_position.x = parseInt(x);
        }
        y = localStorage.getItem('character_position_y');
        if (y) {
            this.character_position.y = parseInt(y);
        }
    }
});

app.mount('#app');
