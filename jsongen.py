with open('last-names.json', 'w') as f:
	f.write("{\n")
	for i in open('last-names.txt', 'r').readlines():
		f.write('"%s": true,\n'%(i.strip()))
	f.write("}")
