import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import io from 'socket.io-client';

class SendMessage extends React.Component{
	constructor(props){
		super(props);
		this.socket = props.socket;
		this.state = {
			text: '',
			handle: props.handle,
		}
		this.sendMessage = this.sendMessage.bind(this);
	}
	componentDidMount(){
		console.log('SendMessage component is mounted');
	}
	componentWillUnmount(){
		console.log('SendMessage component unmounted');
	}
	sendMessage(){
		let text = this.state.text;

		if(text){
			this.socket.emit('sendMessage', {
				clientId: this.socket.id,
				handle: this.state.handle,
				text: text,
			});
		}

		this.setState({text: ''});
	}
	render(){
		return(
			<View style={styles.sendMessage}>
				<TextInput 
					style={styles.sendMessageTextInput}
					onChangeText={text=>this.setState({text: text})}
					value={this.state.text}
					placeholder="Type a message"
				/>
				<TouchableOpacity 
					style={styles.button} 
					onPress={this.sendMessage}>
					<Text>Send Message</Text>
				</TouchableOpacity>
			</View>
		);
	}
}

class Message extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			isFromClient: props.isFromClient,
			handle: props.handle || '',
			text: props.text || '',
			sentTime: props.sentTime || '',
		}
	}
	componentDidMount(){
		
	}
	componentWillUnmount(){

	}
	render(){
		return (
			<View style={this.state.isFromClient ? styles.messageSelf : styles.message}>
				<View style={{
					display: 'flex',
					flexDirection: 'column',
					marginRight: 10,
				}}>
					<Text style={styles.messageHandle}>{this.state.handle}</Text>
					<Text style={styles.messageText}>{this.state.text}</Text>
				</View>
				<Text style={styles.messageTime}>{this.state.sentTime}</Text>
			</View>
		);
	}
}

class MessageList extends React.Component{
	constructor(props){
		super(props);
		this.socket = props.socket;
		this.state = {
			msgList: [],
			scrolledToBottom: true,
		}
		this.handleScroll = this.handleScroll.bind(this);
		this.scrollToBottom = this.scrollToBottom.bind(this);
		this.renderItem = this.renderItem.bind(this);
		this.getRandomId = this.getRandomId.bind(this);
		this.getCurrentTimeStr = this.getCurrentTimeStr.bind(this);
	}
	getRandomId(){
		let id = '';
		for (let i = 0; i < 20; i++) {
			id += String.fromCharCode(65+Math.floor(Math.random() * 26));
		}
		return id;
	}
	getCurrentTimeStr(){
		const sentDate = new Date();
		function addZero(time){
			var str = time.toString();
			return str.length > 1 ? str : `0${str}`;
		}
		return `${addZero(sentDate.getHours())}:${addZero(sentDate.getMinutes())}`;
	}
	componentDidMount(){
		this.flatlistRef = React.createRef();

		this.socket.on('connect', ()=>{
			this.socket.on('initClient', data=>{
				console.log('init message list');
				this.setState({msgList: data.msgList});
			});
		});

		this.socket.on('sendMessage', data=>{
			const {clientId, handle, text} = data;
			console.log(`${data.handle}: ${data.text}`);
			const msg = {
				id: this.getRandomId(),
				clientId: clientId,
				handle: handle,
				text: text,
				sentTime: this.getCurrentTimeStr(),
			};
			const newMsgList = [...this.state.msgList, msg];
			this.socket.emit('updateMessageList', {
				msg: msg,
			});
			this.setState({msgList: newMsgList}, ()=>{
				if(this.state.scrolledToBottom){
					console.log(this.state.msgList.length);
					this.scrollToBottom();
				}
			});
		});
	}
	componentWillUnmount(){
		
	}
	handleScroll(e){
		// const scrolledToBottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
		// this.setState({scrolledToBottom: scrolledToBottom});
	}
	scrollToBottom(){
		try{
			this.flatlistRef.current.scrollToEnd({animated: true});
		}
		catch{}
	}
	renderItem({item}){
		return <Message isFromClient={this.socket.id===item.clientId} handle={item.handle} text={item.text} sentTime={item.sentTime}/>;
	}
	render(){
		return (
			<View style={styles.messageList}>
				<FlatList
					ref={this.flatlistRef}
					onScroll={this.handleScroll}

					data={this.state.msgList}
					renderItem={this.renderItem}
					keyExtractor={item=>item.id}

					ListFooterComponent={<View style={{height: 0}}/>}
				/>
			</View>
		);
	}
}

class Login extends React.Component{
	constructor(props){
		super(props);
		this.login = this.login.bind(this);
		this.navigation = props.navigation;
		this.state = {
			handle: '',
		}
	}
	login(e){
		const handle = this.state.handle;
		if(handle){
			this.navigation.navigate({
				name: 'Home',
				params: {
					handle: this.state.handle,
				},
			});
		}
	}
	render(){
		return (
			<View>
				<Text>Login Screen</Text>
				<TextInput 
					placeholder='Handle'
					onChangeText={text=>this.setState({handle: text})}
				/>
				<TouchableOpacity
					style={styles.button} 
					onPress={this.login}>
					<Text>Login</Text>
				</TouchableOpacity>
			</View>
		);
	}
}

// Login Screen
const LoginScreen = ({route, navigation})=>{
	return (
		<View style={styles.container}>
			<Login navigation={navigation}/>
			<StatusBar style="auto" />
		</View>
	);
}

//Chat Screen
const ChatScreen = ({route, navigation})=>{
	const {handle} = route.params;

	const socket = io('http://192.168.10.139:5000/');
	return (
		<View style={styles.container}>
			<MessageList socket={socket}/>
			<SendMessage socket={socket} handle={handle}/>
			<StatusBar style="auto" />
		</View>
	);
}

const Stack = createNativeStackNavigator();

export default class App extends React.Component{
	constructor(props){
		super(props);
	}

	componentDidMount(){

	}
	componentWillUnmount(){

	}

	render(){
		return (
			<NavigationContainer>
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen 
						name='Login'
						component={LoginScreen}
					/>
					<Stack.Screen 
						name='Home' 
						component={ChatScreen} 
					/>
				</Stack.Navigator>
			</NavigationContainer>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	button: {
		alignItems: "center",
		backgroundColor: "#DDDDDD",
    	padding: 10,
	},
	message: {
		display: 'flex',
		flexDirection: 'row',
		alignSelf: 'flex-start',
		alignItems: 'flex-end',
		backgroundColor: 'cyan',
		borderRadius: 10,
		padding: 10,
		marginBottom: 10,
	},
	messageSelf: {
		display: 'flex',
		flexDirection: 'row',
		alignSelf: 'flex-end',
		alignItems: 'flex-end',
		backgroundColor: 'lime',
		borderRadius: 10,
		padding: 10,
		marginBottom: 10,
	},
	messageHandle: {
		fontSize: 12,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	messageText: {
		fontSize: 16,
	},
	messageTime: {
		fontStyle: 'italic',
		fontSize: 12,
		color: 'rgba(102, 102, 102, 0.7)',
	},
	messageList: {
		flex: 1,
		position: 'absolute',
		top: Constants.statusBarHeight+10,
		borderColor: 'black',
		width: '100%',
		height: '80%',
		padding: 10,
	},
	sendMessage: {
		position: 'absolute',
		bottom: 25,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '90%',
	},
	sendMessageTextInput: {
		borderWidth: 1,
		borderRadius: 5,
    	padding: 5,
		flexGrow: 4,
		marginRight: 10,
	},
});
