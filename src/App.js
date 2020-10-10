import React from 'react';
import CryptoJS from 'crypto-js'
import axios from 'axios';

class App extends React.Component {

    state = {
        passwords: [],
        masterPassword: '',
        masterPasswordChecked: false,
        pastebin: ''
    };

    getFromStorage = () => {
        const encryptedPasswords = localStorage.getItem(CryptoJS.SHA256(this.state.masterPassword).toString(CryptoJS.enc.Hex))
        if (encryptedPasswords) {
            try {
                const decryptedPasswords = CryptoJS.AES.decrypt(
                    encryptedPasswords,
                    this.state.masterPassword
                ).toString(CryptoJS.enc.Utf8);
                return JSON.parse(decryptedPasswords);
            } catch (error) {
                alert("Invalid pass")
                return this.state.passwords;
            }
        }
        return [];
    }

    setToStorage = (passwords) => {
        const to_save_passwords = JSON.parse(JSON.stringify(passwords));
        for (let i = 0; i < to_save_passwords.length; i++) {
            delete to_save_passwords[i].checked;
        }
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(to_save_passwords), this.state.masterPassword);
        localStorage.setItem(CryptoJS.SHA256(this.state.masterPassword).toString(CryptoJS.enc.Hex), encrypted);
    }

    loadFromPastebin = () => {
        axios({
            method: 'get',
            url: 'https://cors-anywhere.herokuapp.com/https://pastebin.com/raw/' + this.state.pastebin,
        }).then(res => {
            const encryptedPasswords = res.data

            if (encryptedPasswords) {
                try {
                    const decryptedPasswords = CryptoJS.AES.decrypt(
                        encryptedPasswords,
                        this.state.masterPassword
                    ).toString(CryptoJS.enc.Utf8);
                    this.setState({passwords: JSON.parse(decryptedPasswords)});
                } catch (error) {
                    alert("Invalid pass or pastebin code")
                }
            }
        }).catch(error => {
            alert("Invalid pastebin code")
        })
    }

    dumpToPastebin = () => {
        const to_save_passwords = JSON.parse(JSON.stringify(this.state.passwords));
        for (let i = 0; i < to_save_passwords.length; i++) {
            delete to_save_passwords[i].checked;
        }
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(to_save_passwords), this.state.masterPassword);

        const data = new FormData();
        data.append('api_option', 'paste');
        data.append('api_dev_key', 'VoU0CAzzSMiCBJKhilwRtWMPZcKoVE9x');
        data.append('api_paste_code', encrypted);
        data.append('api_paste_name', 'secret');
        data.append('api_paste_expire_date', 'N');

        axios({
            method: 'post',
            url: 'https://cors-anywhere.herokuapp.com/https://pastebin.com/api/api_post.php',
            data: data
        }).then(res => {
            alert(res.data);
            alert("You pastebin code: " + res.data.split("/")[3])
        });
    }

    handleAdd = () => {
        const newPass = [
            ...this.state.passwords,
            {resource: "", login: "", password: "", checked: false}
        ];
        this.setState({passwords: newPass});
        this.setToStorage(newPass);
    }

    handleDelete = index => {
        const newPass = [...this.state.passwords];
        newPass.splice(index, 1);
        this.setState({passwords: newPass});
        this.setToStorage(newPass);
    }

    handleChange = (index, field, value) => {
        const newPass = [...this.state.passwords];
        newPass[index][field] = value;
        this.setState({passwords: newPass});
        this.setToStorage(newPass);
    }

    render() {
        return (
            <div>
                <div>
                    <Header numTodos={this.state.passwords.length}/>

                    <input
                        type={this.state.masterPasswordChecked ? 'input' : 'password'}
                        placeholder='Enter master password'
                        value={this.state.masterPassword}
                        onChange={
                            (event) => {
                                this.setState({masterPassword: event.target.value});
                            }
                        }
                    />
                    <input
                        type="checkbox"
                        checked={this.state.masterPasswordChecked}
                        onChange={
                            (event) => {
                                this.setState({masterPasswordChecked: event.target.checked})
                            }
                        }
                    />
                    <button onClick={() => {this.setState({passwords: this.getFromStorage()})}}>
                        Load from local
                    </button>

                    <div>
                        <input
                            type='input'
                            placeholder='Enter pastebin code'
                            value={this.state.pastebin}
                            onChange={
                                (event) => {
                                    this.setState({pastebin: event.target.value});
                                }
                            }
                        />
                        <button onClick={() => {this.loadFromPastebin()}}>
                            Load from pastebin
                        </button>
                        <button onClick={() => {this.dumpToPastebin()}}>
                            Dump to pastebin
                        </button>
                    </div>

                    <PasswordList
                        passwords={this.state.passwords}
                        onDelete={this.handleDelete}
                        onChange={this.handleChange}
                    />

                    <button onClick={this.handleAdd}>Add password</button>
                </div>
            </div>
        );
    }
}

const Header = (props) => {
    return (
        <div>
            <h1>
                You have {props.numTodos} passwords
            </h1>
        </div>
    )
}


const PasswordList = (props) => {
    const passwords = props.passwords.map((pass, index) => {
        return <PasswordItem
            resource={pass.resource}
            login={pass.login}
            password={pass.password}
            checked={pass.checked}
            key={index} id={index}
            onDelete={props.onDelete}
            onChange={props.onChange}
        />
    })
    return (
        <div>
            {passwords}
        </div>
    );
}

const PasswordItem = (props) => {
    return (
        <div>
            <input
                type='text'
                placeholder='Enter resource'
                value={props.resource}
                onChange={
                    (event) => {
                        props.onChange(props.id, "resource", event.target.value)
                    }
                }
            />
            <input
                type='text'
                placeholder='Enter login'
                value={props.login}
                onChange={
                    (event) => {
                        props.onChange(props.id, "login", event.target.value)
                    }
                }
            />
            <input
                type={props.checked ? 'input' : 'password'}
                placeholder='Enter password'
                value={props.password}
                onChange={
                    (event) => {
                        props.onChange(props.id, "password", event.target.value)
                    }
                }
            />
            <input
                type="checkbox"
                checked={props.checked}
                onChange={
                    (event) => {
                        props.onChange(props.id, "checked", event.target.checked)

                    }
                }
            />
            <button
                onClick={
                    () => {
                        props.onDelete(props.id)
                    }
                }
            >
                del
            </button>
        </div>
    );
}

export default App;
